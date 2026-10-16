// Phase 59-08: Mosje Shield, Welloe Force, Mosje Reborn, Call of the Welloes and Dingetje toch?! (Card List 2.0).
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { markMosjeDefeated } from '../../src/engine/victoryChecker.js';
// @ts-ignore
import { sweepStaysSlots } from '../../src/engine/table/sweepStaysSlots.js';
// @ts-ignore
import { discardPiecieSlot } from '../../src/engine/table/discardPiecieSlot.js';
// @ts-ignore
import { welloeForceThorns } from '../../src/engine/attack/welloeForceThorns.js';
// @ts-ignore
import { QUEST_COSTS } from '../../src/engine/quests/questCosts.js';
// @ts-ignore
import { checkQuestCondition } from '../../src/engine/quests/checkQuestCondition.js';
// @ts-ignore
import { dingetjeForTrait } from '../../src/engine/quests/dingetjeForTrait.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const slotOf = (id: string, mp = 50) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
  s.entryProtected = false;
  return s;
};
const pile = (id: string) => ({ ...slotOf(id, 0), type: 'MOSJE', source: 'welloe', isDefeated: true });
const card = (cardId: string) => ({ cardId, type: 'PIECIE' });

function board(piecieId: string) {
  const s: any = makePiecieState({ piecieId });
  s.players.player_1.energy = 6;
  s.players.player_1.deck = [card('piecie_pot_of_weed'), card('piecie_pot_of_weed')];
  return s;
}
// Activate; answer every pause with the option at `pick` (0 = first).
function play(s: any, pick = 0) {
  const r: any = activatePiecie(s, 'player_1', 0);
  expect(r.success, r.error).toBe(true);
  let st = r.state;
  for (let n = 0; n < 4 && st.pendingChoice; n++) st = resolvePendingChoice(st, st.pendingChoice.options[pick]).state;
  return st;
}

describe('Mosje Shield', () => {
  const shielded = () => {
    const s = board('piecie_mosje_shield');
    s.players.player_1.activeSlots[1] = slotOf('mosje_michelle', 0);
    s._pendingTargets = { own_slot_index: 1 };
    return play(s);
  };
  it('Stays bound to the chosen Mosje; that Mosje is not sent to the Welloe pile (5 MP), the other one is', () => {
    const s = shielded();
    expect(s.players.player_1.piecieSlots[0]).toMatchObject({ cardId: 'piecie_mosje_shield', stays: true, staysEnd: 'endOfNextTurn' });
    const saved = markMosjeDefeated(s, 'player_1', 1);
    expect(saved.players.player_1.activeSlots[1].mp).toBe(5);
    expect(saved.players.player_1.welloePile).toHaveLength(0);
    const other = markMosjeDefeated(s, 'player_1', 0);
    expect(other.players.player_1.activeSlots[0]).toBeNull();
    expect(other.players.player_1.welloePile).toHaveLength(1);
  });
  it('ends at the end of the owner next turn', () => {
    let s = shielded();
    s = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'end');
    expect(s.players.player_1.piecieSlots[0]).toBeNull();
    expect(markMosjeDefeated(s, 'player_1', 1).players.player_1.activeSlots[1]).toBeNull();
  });
});

describe('Welloe Force', () => {
  it('cannot activate with an empty hand', () => {
    const s = board('piecie_welloe_force');
    const r: any = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.energy).toBe(6);
  });
  it('discards 1 hand card as cost, Stays until the start of the next turn; thorns cost the attacker 15 only while it stays', () => {
    const s = board('piecie_welloe_force');
    s.players.player_1.hand = [card('piecie_pot_of_weed')];
    const st = play(s);
    expect(st.players.player_1.hand).toHaveLength(0);
    expect(st.players.player_1.graveyard.some((e: any) => e.cardId === 'piecie_pot_of_weed')).toBe(true);
    expect(st.players.player_1.piecieSlots[0]).toMatchObject({ stays: true, staysEnd: 'startOfNextTurn' });
    const hit = (state: any) => welloeForceThorns({ state, targetPlayerId: 'player_1', attackerPlayerId: 'player_2', attackerSlotIndex: 0 });
    expect(hit(st).players.player_2.activeSlots[0].mp).toBe(35);
    const gone = sweepStaysSlots({ ...st, turnNumber: st.turnNumber + 1 }, 'player_1', 'start');
    expect(hit(gone).players.player_2.activeSlots[0].mp).toBe(50);
  });
});

describe('Mosje Reborn and Call of the Welloes', () => {
  const withPile = (id: string) => {
    const s = board(id);
    s.players.player_1.welloePile = [pile('mosje_jeffrey')];
    return s;
  };
  const def = MOSJES.find((m: any) => m.id === 'mosje_jeffrey');
  it('Mosje Reborn: Level 1, starting MP + 30, fresh, on a free spot', () => {
    const st = play(withPile('piecie_mosje_reborn'));
    expect(st.players.player_1.activeSlots[1]).toMatchObject({ cardId: 'mosje_jeffrey', level: 1, mp: def.startMP + 30, entryProtected: true });
    expect(st.players.player_1.welloePile).toHaveLength(0);
  });
  it('Mosje Reborn needs a Mosje in the Welloe pile', () => {
    expect(activatePiecie(board('piecie_mosje_reborn'), 'player_1', 0).success).toBe(false);
  });
  it('Call of the Welloes: starting MP, fresh, linked both ways, card Stays', () => {
    const st = play(withPile('piecie_call_of_welloes'));
    expect(st.players.player_1.activeSlots[1]).toMatchObject({ cardId: 'mosje_jeffrey', level: 1, mp: def.startMP, entryProtected: true, summonedByPiecie: 'piecie_call_of_welloes' });
    expect(st.players.player_1.piecieSlots[0]).toMatchObject({ cardId: 'piecie_call_of_welloes', stays: true, linkedMosjeCardId: 'mosje_jeffrey' });
  });
  it('Call: the Mosje leaves -> card discarded; the card leaves -> Mosje back to the Welloe pile', () => {
    const st = play(withPile('piecie_call_of_welloes'));
    const a = markMosjeDefeated(st, 'player_1', 1);
    expect(a.players.player_1.piecieSlots[0]).toBeNull();
    expect(a.players.player_1.graveyard.some((e: any) => e.cardId === 'piecie_call_of_welloes')).toBe(true);
    const b = discardPiecieSlot(st, 'player_1', 0);
    expect(b.players.player_1.activeSlots[1]).toBeNull();
    expect(b.players.player_1.welloePile.some((e: any) => e.cardId === 'mosje_jeffrey')).toBe(true);
  });
});

describe('Dingetje toch?!', () => {
  const DING = 'piecie_dingetje_toch';
  const ctx = (p: any, turn = 5) => ({ state: { turnNumber: turn }, player: p });
  const player = (hand: any[], slots: any[] = []) => ({ hand, piecieSlots: slots, graveyard: [] as any[] });
  it('pays a food / substance / Snelle cost from the hand and leaves play', () => {
    const p = player([card(DING)]);
    expect(QUEST_COSTS.discard_food_piecie.canPay(ctx(p), { zone: 'hand', index: 0 })).toBe(true);
    expect(QUEST_COSTS.discard_substance_piecie.canPay(ctx(p), { zone: 'hand', index: 0 })).toBe(true);
    expect(QUEST_COSTS.discard_snelle.canPay(ctx(p), { zone: 'hand', index: 0 })).toBe(true);
    QUEST_COSTS.discard_food_piecie.pay(ctx(p), { zone: 'hand', index: 0 });
    expect(p.hand).toHaveLength(0);
    expect(p.graveyard[0].cardId).toBe(DING);
    expect(QUEST_COSTS.discard_food_piecie.canPay(ctx(player([card('piecie_pot_of_weed')])), { zone: 'hand', index: 0 })).toBe(false);
  });
  it('"ready" requirements need a ready Dingetje', () => {
    expect(QUEST_COSTS.discard_ready_piecie.canPay(ctx(player([card(DING)])), { zone: 'hand', index: 0 })).toBe(false);
    const unready = { cardId: DING, type: 'PIECIE', faceDown: true, canActivateOnTurn: 9 };
    expect(QUEST_COSTS.discard_ready_piecie.canPay(ctx(player([], [unready])), { zone: 'ready', index: 0 })).toBe(false);
    const ready = { cardId: DING, type: 'PIECIE', faceDown: true, canActivateOnTurn: 2 };
    expect(QUEST_COSTS.discard_ready_piecie.canPay(ctx(player([], [ready])), { zone: 'ready', index: 0 })).toBe(true);
  });
  it('meets one trait requirement (needs Physical 2 stars) on a Physical 1 star Mosje, and only trait ones', () => {
    const s: any = makePiecieState({ piecieId: 'piecie_kannetje_melk' });
    const me = s.players.player_1;
    me.activeSlots[0].traits = { physical: 1 };
    me.hand = [card(DING)];
    const physical = { costId: 'physical_2' };
    expect(checkQuestCondition(s, 'player_1', 0, physical).ok).toBe(false);
    expect(checkQuestCondition(s, 'player_1', 0, physical, { zone: 'hand', index: 0 })).toMatchObject({ ok: true, dingetje: { zone: 'hand', index: 0 } });
    expect(checkQuestCondition(s, 'player_1', 0, { costId: 'mp_80_plus' }, { zone: 'hand', index: 0 }).ok).toBe(false);
    expect(dingetjeForTrait(s, 'player_1', { costId: 'mp_80_plus' }, { zone: 'hand', index: 0 })).toBeNull();
  });
  it('Gekke Vogels: the KatjeGang requirement is met by discarding Dingetje (asked only when it matters)', () => {
    const s = board('piecie_gekke_vogels');
    s.players.player_1.activeSlots = [slotOf('mosje_jisca'), slotOf('mosje_alyssa_fissa')];
    s.players.player_1.jiscaRolledThisTurn = true;
    s.players.player_1.hand = [card(DING)];
    const yes = play(s, 0);
    expect(yes.players.player_1.hand).toHaveLength(0);
    expect(yes.players.player_1.piecieSlots[0].startGain).toHaveLength(2);
    const no = play(s, 1);
    expect(no.players.player_1.hand).toHaveLength(1);
    expect(no.players.player_1.piecieSlots[0].startGain).toBeUndefined();
  });
});
