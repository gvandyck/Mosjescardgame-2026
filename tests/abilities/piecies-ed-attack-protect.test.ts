// Phase 59-03: Example-Deck Attack, Pet and protection Piecies, numbers straight from the Card List 2.0 Piecies tables.
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
// @ts-ignore
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
// @ts-ignore
import { loseMP } from '../../src/engine/mpManager.js';
// @ts-ignore
import { markMosjeDefeated } from '../../src/engine/victoryChecker.js';
// @ts-ignore
import { sweepStaysSlots } from '../../src/engine/table/sweepStaysSlots.js';
// @ts-ignore
import { getPower } from '../../src/engine/mp/getPower.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const card = (n: number) => Array.from({ length: n }, (_, i) => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE', i }));
const slotOf = (id: string, mp = 50, level = 1) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
  s.entryProtected = false;
  return s;
};
function board(piecieId: string, o: any = {}) {
  const s: any = makePiecieState({ piecieId, own: o.own, foe: o.foe });
  const me = s.players.player_1;
  const foe = s.players.player_2;
  me.energy = 6;
  me.deck = card(6);
  foe.deck = card(6);
  me.hand = [];
  Object.assign(me.activeSlots[0], o.ownSlot || {});
  Object.assign(foe.activeSlots[0], o.foeSlot || {});
  if (o.second) me.activeSlots[1] = o.second;
  if (o.foe2) foe.activeSlots[1] = o.foe2;
  s._pendingTargets = o.pick || {};
  return s;
}
const run = (s: any) => {
  const r = activatePiecie(s, 'player_1', 0);
  expect(r.success, r.error).toBe(true);
  return r.state;
};
const mp = (s: any, who = 'player_1', i = 0) => s.players[who].activeSlots[i].mp;
const lose = (s: any, n: number, i = 0) => loseMP(s, 'player_1', i, n, 'DRAIN', false, 'player_2');
const attack = (s: any) => attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 });
const MING = 'mosje_ming_predictor';

describe('Attack Piecies: Power this turn', () => {
  it('Te Hard Gaan +20 Power now, -10 MP at the end of the turn, Power gone afterwards', () => {
    const s0 = board('piecie_te_hard_gaan');
    const base = getPower(s0.players.player_1.activeSlots[0]);
    const s = run(s0);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 20);
    expect(mp(s)).toBe(50);
    const e = endTurn(s);
    expect(mp(e)).toBe(40);
    expect(e.players.player_1.activeSlots[0].powerBoostThisTurn).toBeUndefined();
    expect(e.players.player_1.endOfTurnLosses).toEqual([]);
  });

  it("Te Hard Gaan's end-of-turn loss goes through the loss steps (Afblijven! shrinks it)", () => {
    const s = board('piecie_te_hard_gaan');
    s.players.player_1.piecieSlots[1] = { cardId: 'piecie_afblijven', type: 'PIECIE', stays: true, staysEnd: 'startOfNextTurn', activatedRound: 5,
      boundTo: [{ playerId: 'player_1', slotIndex: 0, cardId: s.players.player_1.activeSlots[0].cardId, reduce: 10 }] };
    expect(mp(endTurn(run(s)))).toBe(50);
  });

  it('Te Hard Gaan: the loss is skipped when that Mosje has left play', () => {
    const s = run(board('piecie_te_hard_gaan'));
    s.players.player_1.activeSlots[0] = null;
    s.players.player_1.activeSlots[1] = slotOf(MING);
    expect(mp(endTurn(s), 'player_1', 1)).toBe(50);
  });

  it('Super Saiyan Mos +30 Power this turn', () => {
    const s0 = board('piecie_super_saiyan_mos');
    const base = getPower(s0.players.player_1.activeSlots[0]);
    const s = run(s0);
    expect(getPower(s.players.player_1.activeSlots[0])).toBe(base + 30);
    expect(getPower(endTurn(s).players.player_1.activeSlots[0])).toBe(base);
  });

  it('Momentum Diefje +10 Power; a hit that makes a Mosje lose MP gives +20 MP, a fully reduced hit gives nothing', () => {
    const s = run(board('piecie_momentum_diefje'));
    expect(getPower(s.players.player_1.activeSlots[0])).toBeGreaterThanOrEqual(10);
    const hit = attack(s);
    expect(hit.ok).toBe(true);
    expect(hit.final).toBeGreaterThan(0);
    expect(mp(hit.state)).toBe(70);
    const shield = run(board('piecie_momentum_diefje'));
    shield.players.player_2.piecieSlots[0] = { cardId: 'piecie_afblijven', type: 'PIECIE', stays: true, staysEnd: 'startOfNextTurn', activatedRound: 5,
      boundTo: [{ playerId: 'player_2', slotIndex: 0, cardId: shield.players.player_2.activeSlots[0].cardId, reduce: 1000 }] };
    const none = attack(shield);
    expect(none.final).toBe(0);
    expect(mp(none.state)).toBe(50);
  });
});

describe('Attack Piecies: Level 2+ cards', () => {
  it('Dikke Taks is refused at Level 1 (nothing paid) and works at Level 2', () => {
    const r = activatePiecie(board('piecie_dikke_taks'), 'player_1', 0);
    expect(r.success).toBe(false);
    expect(r.state.players.player_1.energy).toBe(6);
    const s = run(board('piecie_dikke_taks', { ownSlot: { level: 2 } }));
    expect(s.players.player_1.hand).toHaveLength(1);
  });

  it('Dikke Taks: the next attack hits both opponent Mosjes (fresh skipped), consumed by one attack', () => {
    const s = run(board('piecie_dikke_taks', { ownSlot: { level: 2 }, foe2: slotOf(MING) }));
    const hit = attack(s);
    const power = hit.power;
    expect(mp(hit.state, 'player_2', 0)).toBe(50 - power);
    expect(mp(hit.state, 'player_2', 1)).toBe(50 - power);
    expect(hit.state.players.player_1.activeSlots[0].hitBothOpponents).toBeUndefined();
    const fresh = run(board('piecie_dikke_taks', { ownSlot: { level: 2 }, foe2: { ...slotOf(MING), entryProtected: true } }));
    expect(mp(attack(fresh).state, 'player_2', 1)).toBe(50);
  });

  it('Harde Didde sends a Mosje with 40 MP or less to the Welloe pile; refused at Level 1; a higher MP target is left alone', () => {
    const s = run(board('piecie_harde_didde', { ownSlot: { level: 2 }, foe: { mp: 40 } }));
    expect(s.players.player_2.activeSlots[0]).toBeNull();
    expect(s.players.player_2.welloePile).toHaveLength(1);
    const l1 = activatePiecie(board('piecie_harde_didde', { foe: { mp: 40 } }), 'player_1', 0);
    expect(l1.success).toBe(false);
    expect(l1.state.players.player_1.energy).toBe(6);
    const high = run(board('piecie_harde_didde', { ownSlot: { level: 2 }, foe: { mp: 45 }, pick: { opp_slot_index: 0 } }));
    expect(high.players.player_2.activeSlots[0]).not.toBeNull();
  });

  it('Klaar Met Jou: 30 MP or less to the Welloe pile and draw 1; 35 MP is not allowed', () => {
    const s = run(board('piecie_klaar_met_jou', { ownSlot: { level: 2 }, foe: { mp: 30 } }));
    expect(s.players.player_2.welloePile).toHaveLength(1);
    expect(s.players.player_1.hand).toHaveLength(1);
    const no = run(board('piecie_klaar_met_jou', { ownSlot: { level: 2 }, foe: { mp: 35 }, pick: { opp_slot_index: 0 } }));
    expect(no.players.player_2.welloePile || []).toHaveLength(0);
  });
});

describe('Protection Piecies: reductions shrink a loss, never stop it', () => {
  it('Afblijven!: every loss of the chosen Mosje 10 less until the start of the next turn', () => {
    const s = run(board('piecie_afblijven'));
    expect(s.players.player_1.piecieSlots[0].stays).toBe(true);
    expect(mp(lose(s, 25))).toBe(35);
    const small = lose(s, 5);
    expect(mp(small)).toBe(50);
    expect(mp(lose(lose(s, 25), 25))).toBe(20);
    const later = { ...s, turnNumber: s.turnNumber + 1 };
    expect(sweepStaysSlots(later, 'player_1', 'start').players.player_1.piecieSlots[0]).toBeNull();
  });

  it('Laat me chillen!: the first loss of any own Mosje is 20 less, then the card is discarded; the second is unreduced', () => {
    const s = run(board('piecie_laat_me_chillen', { second: slotOf(MING) }));
    const first = lose(s, 30, 1);
    expect(mp(first, 'player_1', 1)).toBe(40);
    expect(first.players.player_1.piecieSlots[0]).toBeNull();
    expect(first.players.player_1.graveyard.some((g: any) => g.cardId === 'piecie_laat_me_chillen')).toBe(true);
    expect(mp(lose(first, 30, 1), 'player_1', 1)).toBe(10);
  });

  it('Laat me chillen! unused: discarded at the end of the owner next turn', () => {
    const s = run(board('piecie_laat_me_chillen'));
    expect(sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'end').players.player_1.piecieSlots[0]).toBeNull();
    expect(sweepStaysSlots(s, 'player_1', 'end').players.player_1.piecieSlots[0]).not.toBeNull();
  });

  it('a Stays card bound to a Mosje is discarded at once when that Mosje leaves play', () => {
    const s = run(board('piecie_afblijven'));
    const gone = markMosjeDefeated(s, 'player_1', 0);
    expect(gone.players.player_1.piecieSlots[0]).toBeNull();
    expect(gone.players.player_1.graveyard.some((g: any) => g.cardId === 'piecie_afblijven')).toBe(true);
  });
});

describe('Pet line', () => {
  it('Bowie & Stormey: a non-named Mosje loses 10 less, a named one (Michelle) 20 less', () => {
    expect(mp(lose(run(board('piecie_bowie_stormey', { ownSlot: { cardId: MING } })), 30))).toBe(30);
    const michelle = slotOf('mosje_michelle');
    const s = run(board('piecie_bowie_stormey', { second: michelle, pick: { own_slot_index: 1 } }));
    expect(mp(lose(s, 30, 1), 'player_1', 1)).toBe(40);
  });

  it('Bowie with Gandoe + Michelle: both covered 20 less and each gains 10 at the start of the next turn', () => {
    const s = run(board('piecie_bowie_stormey', { second: slotOf('mosje_michelle') }));
    expect(mp(lose(s, 30, 0))).toBe(40);
    expect(mp(lose(s, 30, 1), 'player_1', 1)).toBe(40);
    const start = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
    expect(mp(start, 'player_1', 0)).toBe(60);
    expect(mp(start, 'player_1', 1)).toBe(60);
    expect(sweepStaysSlots(start, 'player_1', 'start').players.player_1.activeSlots[0].mp).toBe(60);
  });

  it('Bowie with Gandoe + a Tuk also pairs', () => {
    const s = run(board('piecie_bowie_stormey', { second: slotOf('mosje_tuk_healer') }));
    expect(mp(lose(s, 30, 1), 'player_1', 1)).toBe(40);
  });

  it('ViannaPoes: 10 less on any Mosje, 20 less on a Cless; lasts until the end of the next turn', () => {
    const plain = run(board('piecie_vianna_poes'));
    expect(mp(lose(plain, 30))).toBe(30);
    const cless = run(board('piecie_vianna_poes', { second: slotOf('mosje_cless_teacher'), pick: { own_slot_index: 1 } }));
    expect(mp(lose(cless, 30, 1), 'player_1', 1)).toBe(40);
    expect(sweepStaysSlots({ ...cless, turnNumber: cless.turnNumber + 1 }, 'player_1', 'end').players.player_1.piecieSlots[0]).toBeNull();
  });

  it('the pet cover ends with the Mosje it covers', () => {
    const s = run(board('piecie_vianna_poes'));
    expect(markMosjeDefeated(s, 'player_1', 0).players.player_1.piecieSlots[0]).toBeNull();
  });
});
