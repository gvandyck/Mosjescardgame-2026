// @ts-nocheck
// Phase 70-08 (D-02..D-05): the Personal Quest attempt - Needs, then Pay, then Roll; a win ends the game; a fail
// discards the Piecies named under Needs and shuffles the card back into the deck.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot, build as buildQuest } from '../helpers/quest56.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolvePersonalQuestAttempt } from '../../src/engine/personalQuests/resolvePersonalQuestAttempt.js';
import { resolveQuestAttempt } from '../../src/engine/quests/resolveQuestAttempt.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { shuffleDeck } from '../../src/engine/deckEngine.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { djTurnKey } from '../../src/abilities/mosje/canDjReroll.js';

vi.mock('../../src/engine/deckEngine.js', async (importOriginal) => {
  const m = await importOriginal();
  return { ...m, shuffleDeck: vi.fn((cards) => [...cards].reverse()) };
});

afterEach(() => { clearTestDice(); vi.mocked(shuffleDeck).mockClear(); });

const HIGH = () => 0.7; // d6 = 5
const LOW = () => 0.2; // d6 = 2
const noRng = () => { throw new Error('rng must not be called'); };
const card = (cardId, type = 'PIECIE') => ({ cardId, type });
const pq = (id) => card(id, 'PERSONAL_QUEST');
const placed = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });
const mk = (over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, ...over });
const FILLER = card('piecie_affoe');
function world({ slot = mk(), second = null, hand = [pq('pq_charge')], p1 = {}, top = {} } = {}) {
  return makeEngineState({
    turnNumber: 5,
    players: { player_1: { activeSlots: [slot, second], hand, deck: [FILLER], ...p1 }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
    ...top,
  });
}
const go = (s, cardId = 'pq_charge', o = {}) => rollPersonalQuestAttempt(s, 'player_1', { cardId, slotIndex: 0, rng: HIGH, ...o });
const names = (p) => (p.graveyard || []).map(c => c.cardId);
const copy = (s) => JSON.parse(JSON.stringify(s));

describe('refusal never mutates', () => {
  it('an illegal attempt returns the reason and the state it was given', () => {
    const s = world({ hand: [] });
    const before = copy(s);
    const r = go(s, 'pq_charge', { rng: noRng });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/hand/i);
    expect(r.state).toEqual(before);
  });
  it('Needs false: nothing is paid, nothing is rolled', () => {
    const s = world({ slot: mk({ mp: 30 }) });
    const r = go(s, 'pq_charge', { rng: noRng });
    expect(r.ok).toBe(false);
    expect(r.state.players.player_1.activeSlots[0].mp).toBe(30);
    expect(r.state.players.player_1.hand).toHaveLength(1);
  });
  it('Pay unpayable: nothing is rolled', () => {
    const s = world({ slot: mk({ mp: 30 }), hand: [pq('pq_sterke_jongen')], top: { activePlace: 'place_the_gym' } }); // no gear to discard
    const r = go(s, 'pq_sterke_jongen', { rng: noRng });
    expect(r.ok).toBe(false);
    expect(r.state.players.player_1.hand).toHaveLength(1);
  });
});

describe('a legal attempt', () => {
  it('takes the card, pays, marks the action, then rolls', () => {
    const s = world({ slot: mk({ traits: { strength: 2 } }) });
    const r = go(s);
    expect(r.ok).toBe(true);
    const p1 = r.state.players.player_1;
    expect(p1.hand).toHaveLength(0);
    expect(p1.activeSlots[0].mp).toBe(30);
    expect(p1.activeSlots[0].actedThisTurn).toBe(true);
    expect(r.pending).toMatchObject({ kind: 'personal', playerId: 'player_1', slotIndex: 0, cardId: 'pq_charge', questId: 'pq_charge', dice: [5, 5], diceCount: 2, win: true });
    expect(r.pending.need).toEqual({ count: 2, face: 4, orHigher: true });
    expect(r.state.status).toBe('PLAYING');
  });
  it('Pay: Aloha Tech Support takes 2 Energy; World Record Run moves two gear cards to the pile', () => {
    const slot = mk({ subtype: 'DIGITAL', traits: { technical: 2 } });
    const hand = [pq('pq_aloha_tech_support'), ...Array.from({ length: 5 }, () => FILLER)];
    const aloha = go(world({ slot, hand, p1: { energy: 4, piecieSlots: [placed('piecie_dumbbells'), null, null] } }), 'pq_aloha_tech_support');
    expect(aloha.ok).toBe(true);
    expect(aloha.state.players.player_1.energy).toBe(2);
    const wr = go(world({ slot: mk({ subtype: 'DIGITAL', traits: { technical: 2 } }), hand: [pq('pq_world_record_run'), card('piecie_keyboard'), card('piecie_mouse'), FILLER] }), 'pq_world_record_run');
    expect(wr.ok).toBe(true);
    expect(wr.state.players.player_1.hand.map(c => c.cardId)).toEqual(['piecie_affoe']);
    expect(names(wr.state.players.player_1)).toEqual(['piecie_keyboard', 'piecie_mouse']);
  });
  it('High Roller: 4 Energy paid rolls 2 extra dice, never more than 6', () => {
    const slot = mk({ subtype: 'CREATIVE', traits: { artistic: 1 } });
    const r = go(world({ slot, hand: [pq('pq_high_roller')], p1: { energy: 6 } }), 'pq_high_roller', { choice: { energy: 4 } });
    expect(r.pending.diceCount).toBe(3);
    expect(r.state.players.player_1.energy).toBe(2);
    const big = go(world({ slot: mk({ subtype: 'CREATIVE', traits: { artistic: 3 } }), hand: [pq('pq_high_roller')], p1: { energy: 20 } }), 'pq_high_roller', { choice: { energy: 12 } });
    expect(big.pending.dice).toHaveLength(6);
  });
});

describe('success ends the game', () => {
  it('records which Personal Quest and which Mosje won, and nothing else happens', () => {
    const s = world({ slot: mk({ traits: { strength: 2 } }) });
    const r = go(s);
    const out = resolvePersonalQuestAttempt(r.state, r.pending);
    expect(out.ok).toBe(true);
    expect(out.win).toBe(true);
    expect(out.state.status).toBe('FINISHED');
    expect(out.state.winnerId).toBe('player_1');
    expect(out.state.winReason).toBe('PERSONAL_QUEST');
    expect(out.state.winningQuest).toMatchObject({ cardId: 'pq_charge', mosjeCardId: out.state.players.player_1.activeSlots[0].cardId, slotIndex: 0, dice: [5, 5] });
    expect(out.state.players.player_1.deck.map(c => c.cardId)).toEqual(['piecie_affoe']); // the card is not shuffled back
    expect(shuffleDeck).not.toHaveBeenCalled();
  });
  it('resolveQuestAttempt hands a held Personal Quest roll over', () => {
    const r = go(world({ slot: mk({ traits: { strength: 2 } }) }));
    const held = { ...r.state, pendingQuestRoll: r.pending };
    const out = resolveQuestAttempt(held, null);
    expect(out.ok).toBe(true);
    expect(out.state.winReason).toBe('PERSONAL_QUEST');
    expect(out.state.pendingQuestRoll).toBeUndefined();
  });
});

describe('failure (D-05)', () => {
  const fail = (s, cardId, o = {}) => {
    const r = go(s, cardId, { rng: LOW, ...o });
    expect(r.ok).toBe(true);
    expect(r.pending.win).toBe(false);
    return resolvePersonalQuestAttempt(r.state, r.pending);
  };
  it('the game goes on, Pay stays paid, the card is back in the reshuffled deck', () => {
    const out = fail(world({ slot: mk({ traits: { strength: 1 } }) }), 'pq_charge');
    expect(out.ok).toBe(true);
    expect(out.win).toBe(false);
    const p1 = out.state.players.player_1;
    expect(out.state.status).toBe('PLAYING');
    expect(out.state.winningQuest).toBeUndefined();
    expect(p1.activeSlots[0].mp).toBe(30); // never refunded
    expect(shuffleDeck).toHaveBeenCalledTimes(1);
    expect(p1.deck.map(c => c.cardId)).toEqual(['pq_charge', 'piecie_affoe']); // the spy reverses: [filler, pq] -> [pq, filler]
    expect(p1.hand.map(c => c.cardId)).not.toContain('pq_charge');
    expect(names(p1)).not.toContain('pq_charge');
  });
  it('the Mosje has used its action', () => {
    const out = fail(world({ slot: mk({ traits: { strength: 1 } }) }), 'pq_charge');
    expect(out.state.players.player_1.activeSlots[0].actedThisTurn).toBe(true);
  });
  it('Vibe Coded: the gear Piecie is discarded, also when attached to a Mosje', () => {
    const slot = mk({ subtype: 'DIGITAL', traits: { technical: 1 }, attachments: [{ cardId: 'piecie_keyboard', attachedTurn: 1 }] });
    const out = fail(world({ slot, hand: [pq('pq_vibe_coded')] }), 'pq_vibe_coded');
    const p1 = out.state.players.player_1;
    expect(p1.activeSlots[0].attachments).toEqual([]);
    expect(names(p1)).toEqual(['piecie_keyboard']);
  });
  it('two qualifying gear cards: the one named in choice.readyPiecies goes, the other stays', () => {
    const slot = mk({ subtype: 'DIGITAL', traits: { technical: 1 } });
    const s = () => world({ slot, hand: [pq('pq_vibe_coded')], p1: { piecieSlots: [placed('piecie_keyboard'), placed('piecie_mouse'), null] } });
    const named = fail(s(), 'pq_vibe_coded', { choice: { readyPiecies: [{ zone: 'slot', slotIndex: 1, cardId: 'piecie_mouse' }] } });
    expect(names(named.state.players.player_1)).toEqual(['piecie_mouse']);
    expect(named.state.players.player_1.piecieSlots[0]?.cardId).toBe('piecie_keyboard');
    expect(named.state.players.player_1.piecieSlots[1]).toBeNull();
    const dflt = fail(s(), 'pq_vibe_coded');
    expect(names(dflt.state.players.player_1)).toEqual(['piecie_keyboard']);
    expect(dflt.state.players.player_1.piecieSlots[1]?.cardId).toBe('piecie_mouse');
  });
  it('Sterke Jongen: the Place stays in play, the Pay gear is gone', () => {
    const out = fail(world({ slot: mk({ traits: { strength: 1 } }), hand: [pq('pq_sterke_jongen')], top: { activePlace: 'place_the_gym' }, p1: { piecieSlots: [placed('piecie_dumbbells'), null, null] } }), 'pq_sterke_jongen');
    expect(out.state.activePlace).toBe('place_the_gym');
    expect(names(out.state.players.player_1)).toEqual(['piecie_dumbbells']);
  });
  it('Michelinster: Ronald Kip is discarded, the second Mosje stays, the food was paid', () => {
    const out = fail(world({
      slot: mk({ traits: { strength: 1 } }), second: mkSlot({ mp: 40 }),
      hand: [pq('pq_michelinster'), card('piecie_kannetje_melk')], p1: { piecieSlots: [placed('piecie_ronald_kip'), null, null] },
    }), 'pq_michelinster');
    const p1 = out.state.players.player_1;
    expect(p1.activeSlots[1]).toBeTruthy();
    expect(p1.piecieSlots[0]).toBeNull();
    expect(names(p1).sort()).toEqual(['piecie_kannetje_melk', 'piecie_ronald_kip']);
    expect(p1.hand).toHaveLength(0);
  });
});

describe('reaction windows and rerolls', () => {
  const two = { traits: { strength: 2 } };
  it('a reroll on a Personal Quest roll re-checks the win with its own need (DJ 80/20)', () => {
    const dj = mkSlot({ mp: 40, level: 1 }); dj.cardId = 'mosje_dj_8020';
    const s = world({ slot: mk(two), second: dj });
    const seq = [0.2, 0.7]; // [2, 5]
    const r = go(s, 'pq_charge', { rng: () => seq.shift() });
    expect(r.ok).toBe(true);
    expect(r.reactionPending).toBe(true);
    expect(r.state.pendingReaction.eligible).toContain('djReroll:0');
    expect(r.state.pendingQuestRoll.win).toBe(false);
    pushTestDice([4]);
    const re = resolveReaction(r.state, 'player_1', 'djReroll:0');
    expect(re.ok).toBe(true);
    expect(re.state.pendingQuestRoll.dice).toEqual([4, 5]);
    expect(re.state.pendingQuestRoll.win).toBe(true);
    const out = resolvePersonalQuestAttempt(re.state, null);
    expect(out.state.winReason).toBe('PERSONAL_QUEST');
  });
  it('a reroll grant (Dubbele Dosis style) is offered and re-checks the win', () => {
    const s = world({ slot: mk(two), p1: { rerollGrants: [{ scope: 'ownQuest', uses: 1, turnKey: '5:player_1' }] } });
    const seq = [0.2, 0.7];
    const r = go(s, 'pq_charge', { rng: () => seq.shift() });
    expect(r.reactionPending).toBe(true);
    expect(r.state.pendingReaction.eligible).toContain('piecieReroll:1'.replace('1', '0'));
    pushTestDice([6]);
    const re = resolveReaction(r.state, 'player_1', 'piecieReroll:0');
    expect(re.state.pendingQuestRoll.win).toBe(true);
    expect(re.state.players.player_1.rerollGrants).toEqual([]);
    const out = resolvePersonalQuestAttempt(re.state, null);
    expect(out.state.status).toBe('FINISHED');
  });
  it('a held roll of a lost Personal Quest fails and shuffles the card back', () => {
    const dj = mkSlot({ mp: 40, level: 1 }); dj.cardId = 'mosje_dj_8020';
    const r = go(world({ slot: mk(two), second: dj }), 'pq_charge', { rng: LOW });
    const re = resolveReaction(r.state, 'player_1', null);
    const out = resolvePersonalQuestAttempt(re.state, null);
    expect(out.win).toBe(false);
    expect(out.state.players.player_1.deck[0].cardId).toBe('pq_charge');
  });
  it('a Snelle window before the roll holds the attempt; after a pass it replays once', () => {
    const s = world({ slot: mk(two), hand: [pq('pq_charge'), card('snelle_sleutelpuntje', 'SNELLE_PIECIE')] });
    const r = go(s, 'pq_charge');
    expect(r.ok).toBe(true);
    expect(r.reactionPending).toBe(true);
    expect(r.state.players.player_1.hand).toHaveLength(2); // nothing paid yet
    expect(r.state.players.player_1.activeSlots[0].mp).toBe(60);
    pushTestDice([5, 5]);
    const re = resolveReaction(r.state, 'player_1', null);
    expect(re.ok).toBe(true);
    const p1 = re.state.players.player_1;
    expect(p1.activeSlots[0].mp).toBe(30); // paid once
    expect(p1.hand.map(c => c.cardId)).toEqual(['snelle_sleutelpuntje']); // card left the hand once
    expect(re.state.pendingQuestRoll).toMatchObject({ kind: 'personal', cardId: 'pq_charge', win: true });
  });
});

describe('an ordinary Quest still resolves as before', () => {
  it('Steady win with the shared plumbing', () => {
    const { s, q } = buildQuest('tough_it_out');
    const r = rollQuestAttempt(s, 'player_1', { slotIndex: 0, stackId: q.stack, rng: HIGH });
    const out = resolveQuestAttempt(r.state, r.pending);
    expect(out.ok).toBe(true);
    expect(out.win).toBe(true);
    expect(out.state.winReason).toBeNull();
  });
});
