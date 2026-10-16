// Phase 59-02: Example-Deck MP / Substance / Gear Piecies, numbers straight from the Card List 2.0 Piecies tables.
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { pushTestDice } from '../../src/engine/dice/testDiceQueue.js';
// @ts-ignore
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { checkQuestCondition } from '../../src/engine/quests/checkQuestCondition.js';
// @ts-ignore
import { applyMomentumBoostWin } from '../../src/engine/quests/applyMomentumBoostWin.js';
// @ts-ignore
import { sweepStaysSlots } from '../../src/engine/table/sweepStaysSlots.js';
// @ts-ignore
import { getQuestDef } from '../../src/engine/quests/getQuestDef.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const card = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: `piecie_pot_of_weed`, type: 'PIECIE', i }));
function board(piecieId: string, o: any = {}) {
  const s: any = makePiecieState({ piecieId, own: o.own, foe: o.foe });
  const me = s.players.player_1;
  const foe = s.players.player_2;
  me.energy = 6;
  me.deck = card(6);
  foe.deck = card(6);
  me.hand = o.hand || [];
  Object.assign(me.activeSlots[0], o.ownSlot || {});
  Object.assign(foe.activeSlots[0], o.foeSlot || {});
  if (o.pick) s._pendingTargets = o.pick;
  if (o.place) s.activePlace = o.place;
  return s;
}
const run = (s: any) => {
  const r = activatePiecie(s, 'player_1', 0);
  expect(r.success, r.error).toBe(true);
  return r.state;
};
const mp = (s: any, who = 'player_1', i = 0) => s.players[who].activeSlots[i].mp;
const binti = () => MOSJES.find((m: any) => m.id === 'mosje_binti');

describe('MP Piecies', () => {
  it('Kannetje Melk +25, Broodje Doner +35', () => {
    expect(mp(run(board('piecie_kannetje_melk')))).toBe(75);
    expect(mp(run(board('piecie_broodje_doner')))).toBe(85);
  });

  it("Nature's Gift +30, +40 with Resilient 2 stars", () => {
    expect(mp(run(board('piecie_eendjes_voeren', { ownSlot: { traits: { resilient: 1 } } })))).toBe(80);
    expect(mp(run(board('piecie_eendjes_voeren', { ownSlot: { traits: { resilient: 2 } } })))).toBe(90);
  });

  it('Protein Shake +25 on Physical 1 star, +35 on 3 stars or in Boxing Ring, refused target below 1 star', () => {
    expect(mp(run(board('piecie_protein_shake', { ownSlot: { traits: { physical: 1 } } })))).toBe(75);
    expect(mp(run(board('piecie_protein_shake', { ownSlot: { traits: { physical: 3 } } })))).toBe(85);
    expect(mp(run(board('piecie_protein_shake', { ownSlot: { traits: { physical: 1 } }, place: 'place_boxing_ring' })))).toBe(85);
    expect(mp(run(board('piecie_protein_shake', { ownSlot: { traits: { physical: 0 } } })))).toBe(50);
  });

  it('Varkenspootjes: a Binti gains 40, anyone else loses 15, a fresh Mosje is never touched', () => {
    const s = board('piecie_varkenspootjes', { pick: { any_target: { playerId: 'player_2', slotIndex: 0 } } });
    expect(mp(run(s), 'player_2')).toBe(35);
    const b = board('piecie_varkenspootjes', { pick: { any_target: { playerId: 'player_1', slotIndex: 0 } } });
    b.players.player_1.activeSlots[0] = { ...createMosjeSlot(binti(), { level: 1, mp: 20 }), entryProtected: false };
    expect(mp(run(b))).toBe(60);
    const fresh = board('piecie_varkenspootjes', { pick: { any_target: { playerId: 'player_2', slotIndex: 0 } } });
    fresh.players.player_2.activeSlots[0].entryProtected = true;
    expect(mp(run(fresh), 'player_2')).toBe(50);
  });

  it("food Piecies give +10 more while Binti's Coert holder text is active (Varkenspootjes on Binti = 50), never on a loss", () => {
    const s = board('piecie_kannetje_melk');
    const coert = MOSJES.find((m: any) => m.id === 'mosje_coert_tech');
    s.players.player_1.activeSlots[1] = { ...createMosjeSlot(coert, { level: 1, mp: 30 }), entryProtected: false };
    s.players.player_1.activeSlots[0] = { ...createMosjeSlot(binti(), { level: 1, mp: 20 }), entryProtected: false };
    s._pendingTargets = { own_slot_index: 1 };
    const out = run(s);
    expect(mp(out, 'player_1', 1)).toBe(65); // 30 + 25 + 10
    const v = board('piecie_varkenspootjes', { pick: { any_target: { playerId: 'player_1', slotIndex: 0 } } });
    v.players.player_1.activeSlots[1] = { ...createMosjeSlot(coert, { level: 1, mp: 30 }), entryProtected: false };
    v.players.player_1.activeSlots[0] = { ...createMosjeSlot(binti(), { level: 1, mp: 20 }), entryProtected: false };
    expect(mp(run(v))).toBe(70); // 20 + 40 + 10
  });

  it('Momentum Boost +15, and +10 more only when that Mosje wins a Quest this turn (once)', () => {
    const out = run(board('piecie_momentum_boost'));
    expect(mp(out)).toBe(65);
    const won = applyMomentumBoostWin(out, 'player_1', 0);
    expect(mp(won)).toBe(75);
    expect(mp(applyMomentumBoostWin(won, 'player_1', 0))).toBe(75);
    expect(mp(applyMomentumBoostWin(board('piecie_kannetje_melk'), 'player_1', 0))).toBe(50);
  });
});

describe('Substance Piecies', () => {
  it('Grammetje Pieter: 1-3 loses 15, 4-6 gains 30', () => {
    pushTestDice([3]);
    expect(mp(run(board('piecie_grammetje_pieter')))).toBe(35);
    pushTestDice([4]);
    expect(mp(run(board('piecie_grammetje_pieter')))).toBe(80);
  });

  it('Dikke Jonko: +25, the opponent picks a Mosje for +10, both draw 1', () => {
    const s = board('piecie_dikke_jonko');
    const out = run(s); // one opponent Mosje: auto-picked
    expect(mp(out)).toBe(75);
    expect(mp(out, 'player_2')).toBe(60);
    expect(out.players.player_1.hand.length).toBe(1);
    expect(out.players.player_2.hand.length).toBe(1);
    const two = board('piecie_dikke_jonko');
    two.players.player_2.activeSlots[1] = { ...createMosjeSlot(MOSJES[0], { level: 1, mp: 10 }), entryProtected: false };
    const paused = run(two);
    expect(paused.pendingChoice.playerId).toBe('player_2');
    const done = resolvePendingChoice(paused, paused.pendingChoice.options[1]).state;
    expect(mp(done, 'player_2', 1)).toBe(20);
    expect(done.players.player_1.hand.length).toBe(1);
    expect(done.players.player_2.hand.length).toBe(1);
  });

  it('a paused Piecie finished by a pick opens its reaction window on the finished result (no replay, no double effect)', () => {
    const two = board('piecie_dikke_jonko');
    two.players.player_2.activeSlots[1] = { ...createMosjeSlot(MOSJES[0], { level: 1, mp: 10 }), entryProtected: false };
    two.players.player_2.activeSlots[0].traits = { ...two.players.player_2.activeSlots[0].traits, mental: 2 }; // Jammertje Needs Mental 2 stars
    two.players.player_2.hand = [{ cardId: 'snelle_jammertje_gepakt', type: 'SNELLE_PIECIE' }];
    const paused = run(two);
    const out = resolvePendingChoice(paused, paused.pendingChoice.options[0]);
    expect(out.reactionPending).toBe(true);
    const passed = resolveReaction(out.state, 'player_2', null);
    expect(passed.success).toBe(true);
    expect(mp(passed.state)).toBe(75); // +25 once
    expect(mp(passed.state, 'player_2', 0)).toBe(60);
    expect(passed.state.players.player_1.hand.length).toBe(1);
  });

  it('Affoe: opponent -15, own +10; a fresh opponent pick fizzles the whole card', () => {
    const out = run(board('piecie_affoe', { pick: { opp_slot_index: 0 } }));
    expect(mp(out, 'player_2')).toBe(35);
    expect(mp(out)).toBe(60);
    const f = board('piecie_affoe', { pick: { opp_slot_index: 0 } });
    f.players.player_2.activeSlots[0].entryProtected = true;
    const fizz = run(f);
    expect(mp(fizz, 'player_2')).toBe(50);
    expect(mp(fizz)).toBe(50);
  });

  it('Straffoe: own -5, each non-fresh opponent Mosje -10', () => {
    const out = run(board('piecie_straffoe'));
    expect(mp(out)).toBe(45);
    expect(mp(out, 'player_2')).toBe(40);
  });

  it('Tikker +40, Stays, blocks that Mosje from Questing on the next turn only', () => {
    const out = run(board('piecie_tikker'));
    expect(mp(out)).toBe(90);
    const entry = out.players.player_1.piecieSlots[0];
    expect(entry.stays).toBe(true);
    expect(entry.blockedMosjeSlot).toBe(0);
    const quest = getQuestDef('quest_arm_wrestling');
    expect(checkQuestCondition(out, 'player_1', 0, quest).ok).toBe(true); // same turn
    const next = { ...out, turnNumber: out.turnNumber + 1 };
    expect(checkQuestCondition(next, 'player_1', 0, quest).ok).toBe(false);
    const swept = sweepStaysSlots(next, 'player_1', 'end');
    expect(swept.players.player_1.piecieSlots[0]).toBeNull();
    expect(checkQuestCondition(swept, 'player_1', 0, quest).ok).toBe(true);
  });

  it('Larry / Zegeltje: 1-2 -25 and discard 1, 3-4 +20, 5-6 +40 and draw 2', () => {
    pushTestDice([3]);
    expect(mp(run(board('piecie_larry_zegeltje')))).toBe(70);
    pushTestDice([6]);
    const big = run(board('piecie_larry_zegeltje'));
    expect(mp(big)).toBe(90);
    expect(big.players.player_1.hand.length).toBe(2);
    pushTestDice([1]);
    const low = run(board('piecie_larry_zegeltje', { hand: [{ cardId: 'piecie_affoe', type: 'PIECIE' }, { cardId: 'piecie_straffoe', type: 'PIECIE' }] }));
    expect(mp(low)).toBe(25);
    expect(low.pendingChoice.playerId).toBe('player_1');
    const done = resolvePendingChoice(low, low.pendingChoice.options[0]).state;
    expect(done.players.player_1.hand.length).toBe(1);
    expect(mp(done)).toBe(25); // the roll was not repeated
    expect(done.players.player_1.graveyard.some((g: any) => g.cardId === 'piecie_affoe')).toBe(true);
  });

  it('Bong Hit Demolition destroys the Place and draws 2', () => {
    const out = run(board('piecie_bong_hit_demolition', { place: 'place_the_gym' }));
    expect(out.activePlace).toBeFalsy();
    expect(out.players.player_1.hand.length).toBe(2);
  });
});

describe('Gear Piecies', () => {
  const digital = (s: any) => {
    const coert = MOSJES.find((m: any) => m.subtype === 'DIGITAL');
    s.players.player_1.activeSlots[1] = { ...createMosjeSlot(coert, { level: 1, mp: 0 }), entryProtected: false };
    return s;
  };

  it('Keyboard needs a Digital Mosje; +10 and draw 1', () => {
    const none = activatePiecie(board('piecie_keyboard'), 'player_1', 0);
    expect(none.success).toBe(false);
    expect(none.error).toMatch(/Digital/);
    const out = run(digital(board('piecie_keyboard', { pick: { own_slot_index: 0 } })));
    expect(mp(out)).toBe(60);
    expect(out.players.player_1.hand.length).toBe(1);
  });

  it('Controller +10 and +1 die on one Quest this turn', () => {
    const out = run(digital(board('piecie_controller', { pick: { own_slot_index: 0 } })));
    expect(mp(out)).toBe(60);
    expect(out.players.player_1.questExtraDice).toBe(1);
  });

  it('Boxing Gloves +10 Power this turn on Physical 2 stars, a Gandoe +20, not offered below 2 stars', () => {
    expect(run(board('piecie_boxing_gloves', { ownSlot: { traits: { physical: 2 }, cardId: 'mosje_x' } })).players.player_1.activeSlots[0].powerBoostThisTurn).toBe(10);
    expect(run(board('piecie_boxing_gloves', { ownSlot: { traits: { physical: 2 } } })).players.player_1.activeSlots[0].powerBoostThisTurn).toBe(20);
    expect(run(board('piecie_boxing_gloves', { ownSlot: { traits: { physical: 1 } } })).players.player_1.activeSlots[0].powerBoostThisTurn).toBeUndefined();
  });
});
