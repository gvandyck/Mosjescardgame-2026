// Phase 59-05: the rest of the MP / Substance / Gear / Pet sections plus MP Amplifier and Synergy Field, from the Card List 2.0.
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { sweepStaysSlots } from '../../src/engine/table/sweepStaysSlots.js';
// @ts-ignore
import { gainMP } from '../../src/engine/mpManager.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { coertKasteLuckMorningLuck } from '../../src/abilities/mosje/coertKasteLuckMorningLuck.js';

afterEach(() => vi.restoreAllMocks());

const cards = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: 'PIECIE' }));
const filler = (n: number) => cards(...Array.from({ length: n }, () => 'piecie_pot_of_weed'));
const slotOf = (id: string, mp = 50, extra: any = {}) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
function board(piecieId: string, o: any = {}) {
  const s: any = makePiecieState({ piecieId });
  const me = s.players.player_1;
  const foe = s.players.player_2;
  me.energy = 6;
  me.jiscaRolledThisTurn = true; // Jisca's Perfect Combo roll is random; these tests are about the Piecies
  me.deck = o.deck ?? filler(6);
  me.hand = o.hand ?? [];
  foe.deck = o.foeDeck ?? filler(6);
  foe.hand = o.foeHand ?? [];
  if (o.own) me.activeSlots[0] = o.own;
  if (o.second) me.activeSlots[1] = o.second;
  if (o.stay) o.stay.forEach((id: string, i: number) => { me.piecieSlots[i + 1] = { cardId: id, type: 'PIECIE', stays: true, staysEnd: 'endOfNextTurn', activatedRound: 1 }; });
  s._pendingTargets = o.pick || {};
  return s;
}
const attempt = (s: any) => activatePiecie(s, 'player_1', 0);
const run = (s: any) => {
  const r = attempt(s);
  expect(r.success, r.error).toBe(true);
  return r.state;
};
const answer = (s: any, pick: (options: any[]) => any) => {
  const r = resolvePendingChoice(s, pick(s.pendingChoice.options));
  expect(r.ok).toBe(true);
  return r.state;
};
const mp = (s: any, i = 0) => s.players.player_1.activeSlots[i].mp;
const ids = (list: any[]) => list.map((c) => c.cardId);
const RONALD = () => slotOf('mosje_ronald_chef', 50);

describe('MP section', () => {
  it('Ronald Kip +50; with Ronald, The Master Chef +60 and draw 1', () => {
    expect(mp(run(board('piecie_ronald_kip', { own: slotOf('mosje_coert_tech', 0) })))).toBe(50);
    const s = run(board('piecie_ronald_kip', { own: slotOf('mosje_coert_tech', 0), second: RONALD() }));
    expect(mp(s)).toBe(60);
    expect(s.players.player_1.hand).toHaveLength(1);
  });

  it("Chef's Special +15; with Ronald 15 per Piecie in the opponent's hand, 15..45", () => {
    const hand = (n: number) => [...cards(...Array(n).fill('piecie_keyboard')), { cardId: 'mosje_jisca', type: 'MOSJE' }];
    const at = (n: number, ronald: boolean) => mp(run(board('piecie_chefs_special', { own: slotOf('mosje_coert_tech', 0), second: ronald ? RONALD() : null, foeHand: hand(n) })));
    expect(at(3, false)).toBe(15);
    expect(at(0, true)).toBe(15);
    expect(at(2, true)).toBe(30);
    expect(at(4, true)).toBe(45);
    expect(at(6, true)).toBe(45);
  });

  it('Warm Kannetje Melk: -10 MP and draw 2 (no Binti extra on a loss)', () => {
    const s = run(board('piecie_warm_kannetje_melk', { own: slotOf('mosje_binti', 50), second: slotOf('mosje_coert_tech', 50) }));
    expect(mp(s)).toBe(40);
    expect(s.players.player_1.hand).toHaveLength(2);
  });

  it('Shoettoe: +30 on a Mosje at 20 MP or less, refused when none qualifies', () => {
    expect(mp(run(board('piecie_energy_surge', { own: slotOf('mosje_coert_tech', 20) })))).toBe(50);
    expect(attempt(board('piecie_energy_surge', { own: slotOf('mosje_coert_tech', 25) })).success).toBe(false);
  });
});

describe('MP Amplifier', () => {
  it('arms once; Ronald Kip then makes 90', () => {
    const s = run(board('piecie_mp_amplifier'));
    expect(s.players.player_1.mpAmplifierThisTurn).toBe(true);
    s.players.player_1.piecieSlots[1] = { cardId: 'piecie_ronald_kip', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
    s.players.player_1.activeSlots[0] = slotOf('mosje_coert_tech', 0);
    const out = activatePiecie(s, 'player_1', 1);
    expect(out.success, out.error).toBe(true);
    expect(mp(out.state)).toBe(90);
    expect(out.state.players.player_1.mpAmplifierThisTurn).toBe(false);
  });

  it('doubles a gain from any source once, at most +40 extra', () => {
    const s: any = board('piecie_pot_of_weed', { own: slotOf('mosje_coert_tech', 0) });
    s.players.player_1.mpAmplifierThisTurn = true;
    const a = gainMP(s, 'player_1', 0, 15, 'ABILITY');
    expect(mp(a)).toBe(30);
    expect(mp(gainMP(a, 'player_1', 0, 15, 'ABILITY'))).toBe(45);
    s.players.player_1.mpAmplifierThisTurn = true;
    const big = gainMP(s, 'player_1', 0, 80, 'GAIN'); // 80 + 40 = 120: next Level at 0 MP, no carry-over
    expect([big.players.player_1.activeSlots[0].level, mp(big)]).toEqual([2, 0]);
  });

  it('Jeffrey allows MP Amplifier and Synergy Field but not Ronald Kip', () => {
    const jeffrey = () => slotOf('mosje_jeffrey', 50);
    expect(attempt(board('piecie_mp_amplifier', { second: jeffrey() })).success).toBe(true);
    expect(attempt(board('piecie_synergy_field', { second: jeffrey() })).success).toBe(true);
    expect(attempt(board('piecie_ronald_kip', { second: jeffrey() })).success).toBe(false);
  });
});

describe('Synergy Field', () => {
  it('Stays; +10 on each ability gain of the owner, not on Piecie / Quest gains; two copies stack', () => {
    const s = run(board('piecie_synergy_field', { own: slotOf('mosje_alyssa_fissa', 0) }));
    expect(s.players.player_1.piecieSlots[0]).toMatchObject({ cardId: 'piecie_synergy_field', stays: true });
    expect(mp(gainMP(s, 'player_1', 0, 20, 'ABILITY'))).toBe(30);
    expect(mp(gainMP(s, 'player_1', 0, 20, 'PIECIE'))).toBe(20);
    expect(mp(gainMP(s, 'player_1', 0, 20, 'QUEST'))).toBe(20);
    const two = run(board('piecie_synergy_field', { own: slotOf('mosje_alyssa_fissa', 0), stay: ['piecie_synergy_field'] }));
    expect(mp(gainMP(two, 'player_1', 0, 20, 'ABILITY'))).toBe(40);
  });

  it('does not boost the opponent and is gone after the end of the next turn', () => {
    const s = run(board('piecie_synergy_field', { own: slotOf('mosje_alyssa_fissa', 0) }));
    const foe = gainMP(s, 'player_2', 0, 20, 'ABILITY');
    expect(foe.players.player_2.activeSlots[0].mp).toBe(70);
    const later = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'end');
    expect(later.players.player_1.piecieSlots[0]).toBeNull();
  });
});

describe('Substance section', () => {
  it('Stripje Bennies: draw 3 and -20', () => {
    const s = run(board('piecie_stripje_bennies'));
    expect(s.players.player_1.hand).toHaveLength(3);
    expect(mp(s)).toBe(30);
  });

  it('Pot of Weed: draw 2; an empty deck draws nothing and does not fail', () => {
    expect(run(board('piecie_pot_of_weed')).players.player_1.hand).toHaveLength(2);
    expect(run(board('piecie_pot_of_weed', { deck: [] })).players.player_1.hand).toHaveLength(0);
  });
});

describe('Gear section', () => {
  it('Dumbbells: Physical 1 star +20; Physical 3 stars also draw 1', () => {
    const one = run(board('piecie_dumbbells', { own: slotOf('mosje_coert_tech', 0, { traits: { physical: 1 } }) }));
    expect(mp(one)).toBe(20);
    expect(one.players.player_1.hand).toHaveLength(0);
    const three = run(board('piecie_dumbbells', { own: slotOf('mosje_coert_tech', 0, { traits: { physical: 3 } }) }));
    expect(mp(three)).toBe(20);
    expect(three.players.player_1.hand).toHaveLength(1);
  });

  it('Skipping Rope: draw 1, +1 die only with a Physical 1 star Mosje', () => {
    const yes = run(board('piecie_skipping_rope', { own: slotOf('mosje_coert_tech', 50, { traits: { physical: 1 } }) }));
    expect(yes.players.player_1.hand).toHaveLength(1);
    expect(yes.players.player_1.questExtraDice).toBe(1);
    const no = run(board('piecie_skipping_rope', { own: slotOf('mosje_coert_tech', 50, { traits: { physical: 0 } }) }));
    expect(no.players.player_1.hand).toHaveLength(1);
    expect(no.players.player_1.questExtraDice || 0).toBe(0);
  });

  it('Mouse: needs a Digital Mosje; +10, then pick a deck, then the order of its top 2', () => {
    expect(attempt(board('piecie_mouse', { own: slotOf('mosje_gandoe_destroyer', 50) })).success).toBe(false);
    const A = 'piecie_keyboard', B = 'piecie_tikker';
    let s = run(board('piecie_mouse', { own: slotOf('mosje_coert_tech', 0), deck: cards(A, B, 'piecie_pot_of_weed'), foeDeck: cards('piecie_mouse', 'piecie_controller') }));
    expect(mp(s)).toBe(10);
    expect(s.pendingChoice.playerId).toBe('player_1');
    expect(s.pendingChoice.options.map((o: any) => o.deck)).toEqual(['own', 'opp']);
    s = answer(s, (o) => o.find((x: any) => x.deck === 'own'));
    expect(s.pendingChoice.options.map((o: any) => o.cardId)).toEqual([A, B]);
    s = answer(s, (o) => o.find((x: any) => x.cardId === B));
    expect(s.pendingChoice).toBeUndefined();
    expect(ids(s.players.player_1.deck)).toEqual([B, A, 'piecie_pot_of_weed']);
    expect(mp(s)).toBe(10); // the gain is not paid twice
  });

  it("Mouse can reorder the opponent's deck; with both decks empty it only gains", () => {
    let s = run(board('piecie_mouse', { own: slotOf('mosje_coert_tech', 0), deck: cards('piecie_keyboard'), foeDeck: cards('piecie_mouse', 'piecie_controller') }));
    s = answer(s, (o) => o.find((x: any) => x.deck === 'opp'));
    s = answer(s, (o) => o.find((x: any) => x.cardId === 'piecie_controller'));
    expect(ids(s.players.player_2.deck)).toEqual(['piecie_controller', 'piecie_mouse']);
    const empty = run(board('piecie_mouse', { own: slotOf('mosje_coert_tech', 0), deck: [], foeDeck: [] }));
    expect(empty.pendingChoice).toBeUndefined();
    expect(mp(empty)).toBe(10);
  });
});

describe('Pet section', () => {
  const luck = (s: any, roll: number) => {
    const before = s.players.player_1.hand.length;
    const out = coertKasteLuckMorningLuck.run(JSON.parse(JSON.stringify(s)), { ownerId: 'player_1', holderSlotIndex: 1, roll });
    return { drew: out.players.player_1.hand.length - before, mp: out.players.player_1.activeSlots[1].mp };
  };

  it('Tony: covers the named Coert, KasteLuck 20 less and makes Morning Luck work on a 3-6', () => {
    const luckyCoert = () => slotOf('mosje_coert_kasteluck', 30);
    const s = run(board('piecie_tony', { second: luckyCoert(), pick: { own_slot_index: 1 } }));
    expect(s.players.player_1.piecieSlots[0].boundTo[0]).toMatchObject({ slotIndex: 1, reduce: 20 });
    expect(luck(s, 3)).toEqual({ drew: 1, mp: 35 });
    expect(luck(s, 2)).toEqual({ drew: 0, mp: 30 });
    const without = board('piecie_pot_of_weed', { second: luckyCoert() });
    expect(luck(without, 3)).toEqual({ drew: 0, mp: 30 });
    expect(luck(without, 4)).toEqual({ drew: 1, mp: 35 });
  });

  it('KatjeGang: an Alyssa is covered 20 less, another Mosje 10', () => {
    const a = run(board('piecie_katjegang', { own: slotOf('mosje_alyssa_fissa', 50) }));
    expect(a.players.player_1.piecieSlots[0].boundTo[0].reduce).toBe(20);
    const b = run(board('piecie_katjegang', { own: slotOf('mosje_coert_tech', 50) }));
    expect(b.players.player_1.piecieSlots[0].boundTo[0].reduce).toBe(10);
  });

  it('Gekke Vogels with Jisca, an Alyssa and KatjeGang staying: each gains 15 at the start of the next turn, once', () => {
    let s = run(board('piecie_gekke_vogels', { own: slotOf('mosje_jisca', 50), second: slotOf('mosje_alyssa_fissa', 50), stay: ['piecie_katjegang'] }));
    s = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
    expect(mp(s, 0)).toBe(65);
    expect(mp(s, 1)).toBe(65);
    s = sweepStaysSlots(s, 'player_1', 'start');
    expect(mp(s, 0)).toBe(65);
  });

  it('Gekke Vogels without KatjeGang (or without the pair) is only the pet line', () => {
    let s = run(board('piecie_gekke_vogels', { own: slotOf('mosje_jisca', 50), second: slotOf('mosje_alyssa_fissa', 50) }));
    s = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
    expect(mp(s, 0)).toBe(50);
    s = run(board('piecie_gekke_vogels', { own: slotOf('mosje_jisca', 50), second: slotOf('mosje_coert_tech', 50), stay: ['piecie_katjegang'] }));
    s = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
    expect(mp(s, 0)).toBe(50);
  });
});
