// Phase 59-07: Redbull, Double Trigger, Dubbele Ding, Leipe Swap (Card List 2.0).
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-ignore JS modules
import { activatePiecie, endTurn, startTurn, useMosjeAbility } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { piecieTargetOptions } from '../../src/engine/targets/piecieTargetOptions.js';

afterEach(() => vi.restoreAllMocks());

const slotOf = (id: string, mp = 50, level = 1) => {
  const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
  s.entryProtected = false;
  return s;
};
const hand = (...ids: string[]) => ids.map((cardId) => ({ cardId, type: 'PIECIE' }));
const filler = (n: number) => hand(...Array.from({ length: n }, () => 'piecie_pot_of_weed'));

function board(piecieId: string, o: any = {}) {
  const s: any = makePiecieState({ piecieId });
  const me = s.players.player_1;
  me.energy = o.energy ?? 8;
  me.jiscaRolledThisTurn = true;
  me.deck = filler(6);
  me.hand = o.hand ?? [];
  s.players.player_2.deck = filler(4);
  if (o.own) me.activeSlots[0] = o.own;
  if (o.second) me.activeSlots[1] = o.second;
  if (o.foe) s.players.player_2.activeSlots[0] = o.foe;
  s._pendingTargets = o.pick || {};
  return s;
}
const act = (s: any, idx = 0) => activatePiecie(s, 'player_1', idx);
const heal = (s: any) => { s._pendingTargets = { own_slot_index: 0 }; return useMosjeAbility(s, 'player_1', 'mosje_tuk_healer'); };

describe('Redbull', () => {
  it('lets the chosen Mosje use its ability a second time, paying its Energy again; a third use fails', () => {
    const s = board('piecie_redbull', { own: slotOf('mosje_tuk_healer'), second: slotOf('mosje_gandoe_wizard') });
    const first = heal(s);
    expect(first.success).toBe(true);
    const e0 = first.state.players.player_1.energy;
    const r = act(first.state);
    expect(r.success).toBe(true);
    expect(r.state.players.player_1.energy).toBe(e0 - 2); // Redbull's own cost
    const e1 = r.state.players.player_1.energy;
    const second = heal(r.state);
    expect(second.success).toBe(true);
    expect(second.state.players.player_1.energy).toBe(e1 - 1); // Healing Hands: 1 Energy again
    const third = heal(second.state);
    expect(third.success).toBe(false);
    expect(third.error).toMatch(/already used/);
  });

  it('refuses the second use without the Energy and changes nothing', () => {
    const s = board('piecie_redbull', { own: slotOf('mosje_tuk_healer') });
    const first = heal(s);
    const r = act(first.state);
    r.state.players.player_1.energy = 0;
    r.state._pendingTargets = { own_slot_index: 0 };
    const before = JSON.stringify(r.state);
    const second = heal(r.state);
    expect(second.success).toBe(false);
    expect(second.error).toBe('Not enough Energy');
    expect(JSON.stringify(r.state)).toBe(before);
  });

  it('only offers Mosjes with an activated once-per-turn ability', () => {
    const s = board('piecie_redbull', { own: slotOf('mosje_tuk_healer'), second: slotOf('mosje_jeffrey') });
    const opts = piecieTargetOptions(s, 'player_1', 'piecie_redbull')[0].options;
    expect(opts.map((o: any) => o.label)).toEqual([s.players.player_1.activeSlots[0].name]);
  });

  it('the extra use ends with the turn', () => {
    const s = board('piecie_redbull', { own: slotOf('mosje_tuk_healer') });
    const r = act(s);
    expect(r.state.players.player_1.activeSlots[0].extraAbilityUses).toBe(1);
    const next = endTurn(r.state);
    expect(next.players.player_1.activeSlots[0].extraAbilityUses).toBeUndefined();
  });
});

describe('Double Trigger', () => {
  it('gives both Mosjes with an activated ability one extra use', () => {
    const s = board('piecie_double_trigger', { own: slotOf('mosje_tuk_healer'), second: slotOf('mosje_hacker') });
    s.players.player_1.activeSlots[0].level = 2;
    const r = act(s);
    expect(r.success).toBe(true);
    expect(r.state.players.player_1.activeSlots.map((x: any) => x.extraAbilityUses)).toEqual([1, 1]);
  });
});

describe('Leipe Swap', () => {
  const swap = (own: number, foe: number) => {
    const s = board('piecie_leipe_swap', { own: slotOf('mosje_coert_tech', own, 1), foe: slotOf('mosje_binti', foe, 1), pick: { own_slot_index: 0, opp_slot_index: 0 } });
    return act(s);
  };
  it('swaps 90 <-> 10 for good: no level change, nothing reverts after the end of the turn and the next turn', () => {
    const r = swap(90, 10);
    expect(r.state.players.player_1.activeSlots[0].mp).toBe(10);
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(90);
    expect(r.state.players.player_1.activeSlots[0].level).toBe(1);
    expect(r.state.players.player_2.activeSlots[0].level).toBe(1);
    const next = endTurn(r.state);
    expect(next.players.player_1.activeSlots[0].mp).toBe(10);
    expect(next.players.player_2.activeSlots[0].mp).toBe(90);
    const after = endTurn(startTurn(next));
    expect(after.players.player_1.activeSlots[0].mp).toBe(10);
    expect(after.players.player_2.activeSlots[0].mp).toBe(90);
  });
  it('onto 0 MP nobody gets getemt or goes sideways', () => {
    const r = swap(0, 70);
    const a = r.state.players.player_1.activeSlots[0];
    const b = r.state.players.player_2.activeSlots[0];
    expect(b.mp).toBe(0);
    expect(a.mp).toBe(70);
    expect(b.isDefeated).toBeFalsy();
    expect(b.sideways).toBeFalsy();
    expect(a.sideways).toBeFalsy();
  });
  it('never offers a fresh opponent Mosje', () => {
    const foe = slotOf('mosje_binti', 40);
    foe.entryProtected = true;
    const s = board('piecie_leipe_swap', { own: slotOf('mosje_coert_tech', 30), foe });
    expect(piecieTargetOptions(s, 'player_1', 'piecie_leipe_swap').find((x: any) => x.key === 'opp_slot_index').options).toEqual([]);
    const r = act(s);
    expect(r.state.players.player_1.activeSlots[0].mp).toBe(30);
  });
});

describe('Dubbele Ding', () => {
  const bd = (h: string[], o: any = {}) => {
    const s = board('piecie_dubbele_ding', { hand: hand(...h), energy: o.energy ?? 8, own: slotOf('mosje_coert_tech', 40) });
    s.players.player_1.activeSlots[0].level = 2;
    return s;
  };
  const answer = (state: any, cardId: string) => resolvePendingChoice(state, state.pendingChoice.options.find((x: any) => x.cardId === cardId));

  it('activates two chosen hand Piecies right away, paying each cost, then discards them', () => {
    const s = bd(['piecie_pot_of_weed', 'piecie_kannetje_melk']);
    const e0 = s.players.player_1.energy;
    const r = act(s);
    expect(r.paused).toBe(true);
    expect(r.state.pendingChoice.options.map((x: any) => x.cardId)).toContain('done');
    const a1 = answer(r.state, 'piecie_pot_of_weed');
    expect(a1.state.pendingChoice).toBeTruthy(); // asks for the second pick
    const a2 = answer(a1.state, 'piecie_kannetje_melk');
    const me = a2.state.players.player_1;
    expect(a2.state.pendingChoice).toBeUndefined();
    expect(me.hand.map((c: any) => c.cardId)).not.toContain('piecie_kannetje_melk'); // both left the hand (the others were drawn by them)
    expect(me.graveyard.map((g: any) => g.cardId)).toEqual(expect.arrayContaining(['piecie_pot_of_weed', 'piecie_kannetje_melk', 'piecie_dubbele_ding']));
    const cost = (id: string) => PIECIES.find((p: any) => p.id === id).cost;
    expect(me.energy).toBe(e0 - cost('piecie_dubbele_ding') - cost('piecie_pot_of_weed') - cost('piecie_kannetje_melk')); // each pick paid its cost
    expect(me.piecieSlots.every((x: any) => !x)).toBe(true);
  });

  it('"done" after one pick activates only that one', () => {
    const s = bd(['piecie_pot_of_weed', 'piecie_kannetje_melk']);
    const a1 = answer(act(s).state, 'piecie_kannetje_melk');
    const a2 = answer(a1.state, 'done');
    expect(a2.state.players.player_1.hand.map((c: any) => c.cardId)).toEqual(['piecie_pot_of_weed']);
  });

  it('offers nothing without a free Piecie slot or without Energy', () => {
    const full = bd(['piecie_pot_of_weed']);
    const fill = { cardId: 'piecie_mp_hemorrhage', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 5 };
    full.players.player_1.piecieSlots = [full.players.player_1.piecieSlots[0], { ...fill }, { ...fill }];
    const r1 = act(full);
    expect(r1.paused).toBeFalsy();
    expect(r1.state.players.player_1.hand).toHaveLength(1);
    const broke = bd(['piecie_leipe_swap'], { energy: 2 }); // Leipe Swap costs 4
    const r2 = act(broke);
    expect(r2.paused).toBeFalsy();
    expect(r2.state.players.player_1.hand).toHaveLength(1);
  });

  it('is not offered Piecies that fail their activation gate (Level 2+ cards at Level 1)', () => {
    const s = bd(['piecie_harde_didde']);
    s.players.player_1.activeSlots[0].level = 1;
    const r = act(s);
    expect(r.paused).toBeFalsy();
    expect(r.state.players.player_1.hand).toHaveLength(1);
  });
});
