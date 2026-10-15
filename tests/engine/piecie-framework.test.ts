// Phase 59-01: Piecie choice pause + resume, Level 2+ gate, conditions, target table, Stays data.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/abilities/piecieEffects.js', async (orig) => {
  const real: any = await orig();
  const bump = (state: any, playerId: string) => {
    const s = JSON.parse(JSON.stringify(state));
    s.players[playerId].testBumps = (s.players[playerId].testBumps || 0) + 1;
    return s;
  };
  return {
    ...real,
    // one pick from 2+ options, then +1 bump
    effect_test_pause: (state: any, playerId: string, ctx: any = {}) => {
      const mine = state.players[playerId]._pendingTargets?.test_pick;
      if (ctx.resume && mine !== undefined) return bump(state, playerId);
      return { state, needChoice: { playerId, key: 'test_pick', options: ['a', 'b'], choiceKind: 'test' } };
    },
    // two chained picks
    effect_test_chain: (state: any, playerId: string, ctx: any = {}) => {
      const t = state.players[playerId]._pendingTargets || {};
      if (t.test_one === undefined) return { state, needChoice: { playerId, key: 'test_one', options: [1, 2], choiceKind: 'test' } };
      if (t.test_two === undefined) return { state, needChoice: { playerId, key: 'test_two', options: [3, 4], choiceKind: 'test' } };
      return bump(state, playerId);
    },
    effect_test_single: (state: any, playerId: string) => {
      const t = state.players[playerId]._pendingTargets || {};
      if (t.test_solo === undefined) return { state, needChoice: { playerId, key: 'test_solo', options: ['only'], choiceKind: 'test' } };
      return bump(state, playerId);
    },
    effect_test_none: (state: any, playerId: string) => ({ state, needChoice: { playerId, key: 'x', options: [], choiceKind: 'test' } }),
  };
});

// @ts-ignore JS modules
import { resolvePiecieActivation, activatePiecie } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { activatePiecieFree } from '../../src/engine/table/activatePiecieFree.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { PIECIE_TARGETS } from '../../src/rules/piecieTargets.js';
// @ts-ignore
import { PIECIE_CONDITIONS } from '../../src/rules/piecieConditions.js';
// @ts-ignore
import { piecieTargetOptions } from '../../src/engine/targets/piecieTargetOptions.js';
// @ts-ignore
import { GIVES_MP_PIECIES } from '../../src/rules/givesMpPiecies.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const fake = (effectId: string, extra: any = {}) => ({
  id: 'piecie_kannetje_melk', name: 'Test', effectId, cost: 0, tags: ['TEST'], stays: null, ...extra,
});
const start = (effectId: string, extra: any = {}) => {
  const s = makePiecieState({ piecieId: 'piecie_kannetje_melk' });
  s.players.player_1.piecieSlots[0].faceDown = false;
  return { s, def: fake(effectId, extra) };
};

describe('Piecie choice pause and resume', () => {
  it('pauses on 2+ options, finishes exactly once after the answer', () => {
    const { s, def } = start('effect_test_pause');
    const r = resolvePiecieActivation(s, 'player_1', 0, def, { free: false });
    expect(r.success).toBe(true);
    expect(r.paused).toBe(true);
    expect(r.state.pendingChoice.hook).toBe('piecie');
    expect(r.state.players.player_1.piecieSlots[0]).toBeTruthy();
    expect(r.state.players.player_1.pieciesActivatedThisTurn || 0).toBe(0);
    const bad = resolvePendingChoice(r.state, 'zzz');
    expect(bad.ok).toBe(false);
    const done = resolvePendingChoice(r.state, 'b');
    expect(done.ok).toBe(true);
    const p = done.state.players.player_1;
    expect(done.state.pendingChoice).toBeUndefined();
    expect(p.testBumps).toBe(1);
    expect(p.pieciesActivatedThisTurn).toBe(1);
    expect(p.piecieSlots[0]).toBeNull();
    expect(p.graveyard.length).toBeGreaterThan(0);
    expect(p._pendingTargets?.test_pick).toBeUndefined();
  });

  it('a Stays card keeps its slot after the answer', () => {
    const { s, def } = start('effect_test_pause', { stays: 'custom' });
    const r = resolvePiecieActivation(s, 'player_1', 0, def, { free: false });
    const done = resolvePendingChoice(r.state, 'a');
    expect(done.state.players.player_1.piecieSlots[0].stays).toBe(true);
  });

  it('chained choices pause twice, finish once', () => {
    const { s, def } = start('effect_test_chain');
    const r = resolvePiecieActivation(s, 'player_1', 0, def, { free: false });
    expect(r.state.pendingChoice.key).toBe('test_one');
    const mid = resolvePendingChoice(r.state, 1);
    expect(mid.state.pendingChoice.key).toBe('test_two');
    expect(mid.state.players.player_1.pieciesActivatedThisTurn || 0).toBe(0);
    const done = resolvePendingChoice(mid.state, 4);
    expect(done.state.pendingChoice).toBeUndefined();
    expect(done.state.players.player_1.testBumps).toBe(1);
    expect(done.state.players.player_1.pieciesActivatedThisTurn).toBe(1);
  });

  it('a single option is auto-picked (no pause); zero options still finishes', () => {
    const one = start('effect_test_single');
    const r = resolvePiecieActivation(one.s, 'player_1', 0, one.def, { free: false });
    expect(r.paused).toBeUndefined();
    expect(r.state.pendingChoice).toBeUndefined();
    expect(r.state.players.player_1.testBumps).toBe(1);
    expect(r.state.players.player_1.pieciesActivatedThisTurn).toBe(1);
    const none = start('effect_test_none');
    const z = resolvePiecieActivation(none.s, 'player_1', 0, none.def, { free: false });
    expect(z.state.pendingChoice).toBeUndefined();
    expect(z.state.players.player_1.pieciesActivatedThisTurn).toBe(1);
  });
});

describe('Level 2+ gate and Only-if conditions', () => {
  const gated = ['piecie_harde_didde', 'piecie_klaar_met_jou', 'piecie_dikke_taks'];
  for (const id of gated) {
    it(`${id}: refused at Level 1 (nothing paid), allowed with a Level 2 Mosje`, () => {
      const s = makePiecieState({ piecieId: id });
      s.players.player_1.energy = 10;
      const no = activatePiecie(s, 'player_1', 0);
      expect(no.success).toBe(false);
      expect(no.error).toBe('Needs: one of your Mosjes at Level 2+');
      expect(s.players.player_1.energy).toBe(10);
      const s2 = makePiecieState({ piecieId: id, own: { level: 2, mp: 100 } });
      s2.players.player_1.energy = 10;
      const ok = activatePiecie(s2, 'player_1', 0);
      expect(ok.error).not.toBe('Needs: one of your Mosjes at Level 2+');
      const free = activatePiecieFree(s, 'player_1', { slotIndex: 0 }, { ignoreReadiness: true });
      expect(free.success).toBe(false);
      expect(free.error).toBe('Needs: one of your Mosjes at Level 2+');
    });
  }

  it('Keyboard / Mouse / Controller without a Digital Mosje are refused, nothing paid; with one allowed', () => {
    for (const id of ['piecie_keyboard', 'piecie_mouse', 'piecie_controller']) {
      const s = makePiecieState({ piecieId: id });
      s.players.player_1.activeSlots[0].subtype = 'FIGHTING';
      s.players.player_1.energy = 10;
      const r = activatePiecie(s, 'player_1', 0);
      expect(r.success, id).toBe(false);
      expect(r.error).toBe('Only if a Digital Mosje is on your field');
      expect(s.players.player_1.energy).toBe(10);
      expect(s.players.player_1.piecieSlots[0].activated).toBe(false);
      s.players.player_1.activeSlots[0].subtype = 'DIGITAL';
      expect(activatePiecie(s, 'player_1', 0).success, id).toBe(true);
    }
  });

  it('Those Eyelashes needs Martin/West, Battle Concert an Alyssa, Mosje Reborn a Welloe Mosje + free spot', () => {
    const s = makePiecieState({ piecieId: 'piecie_those_eyelashes' });
    expect(PIECIE_CONDITIONS.piecie_those_eyelashes(s, 'player_1')).not.toBe(true);
    s.players.player_1.activeSlots[0].cardId = 'mosje_parkour_west';
    expect(PIECIE_CONDITIONS.piecie_those_eyelashes(s, 'player_1')).toBe(true);
    expect(PIECIE_CONDITIONS.piecie_battle_concert(s, 'player_1')).not.toBe(true);
    s.players.player_1.activeSlots[0].cardId = 'mosje_alyssa_fissa';
    expect(PIECIE_CONDITIONS.piecie_battle_concert(s, 'player_1')).toBe(true);
    expect(PIECIE_CONDITIONS.piecie_mosje_reborn(s, 'player_1')).not.toBe(true);
    s.players.player_1.welloePile = [{ cardId: 'mosje_jeffrey', type: 'MOSJE' }];
    expect(PIECIE_CONDITIONS.piecie_mosje_reborn(s, 'player_1')).toBe(true);
    s.activePlace = 'place_welloe_graveyard';
    expect(PIECIE_CONDITIONS.piecie_call_of_welloes(s, 'player_1')).not.toBe(true);
    s.activePlace = null;
    s.players.player_1.activeSlots[1] = s.players.player_1.activeSlots[0];
    expect(PIECIE_CONDITIONS.piecie_call_of_welloes(s, 'player_1')).not.toBe(true);
  });

  it('Shhh popo komt! needs 3 Mosjes; Shoettoe needs a Mosje at 20 MP or less', () => {
    const s = makePiecieState({ piecieId: 'piecie_popo_komt' });
    expect(PIECIE_CONDITIONS.piecie_popo_komt(s, 'player_1')).not.toBe(true);
    const sh = makePiecieState({ piecieId: 'piecie_energy_surge', own: { mp: 50 } });
    expect(PIECIE_CONDITIONS.piecie_energy_surge(sh, 'player_1')).not.toBe(true);
    const low = makePiecieState({ piecieId: 'piecie_energy_surge', own: { mp: 20 } });
    expect(PIECIE_CONDITIONS.piecie_energy_surge(low, 'player_1')).toBe(true);
  });

  it('Huisbaas needs a substance Piecie on top of a discard pile', () => {
    const s = makePiecieState({ piecieId: 'piecie_huisbaas' });
    expect(PIECIE_CONDITIONS.piecie_huisbaas(s, 'player_1')).not.toBe(true);
    s.players.player_2.graveyard = [{ cardId: 'piecie_tikker', type: 'PIECIE' }];
    expect(PIECIE_CONDITIONS.piecie_huisbaas(s, 'player_1')).toBe(true);
  });
});

describe('Piecie target table', () => {
  const real = (PIECIES as any[]).filter((p) => p.id !== 'piecie_mp_adjuster');
  it('has an entry for every Piecie id', () => {
    expect(real.length).toBe(73);
    for (const p of real) expect(PIECIE_TARGETS[p.id], p.id).toBeTruthy();
  });
  it('options exclude fresh opponent Mosjes', () => {
    const s = makePiecieState({ piecieId: 'piecie_energy_surge' });
    const slots = s.players.player_2.activeSlots;
    const second = createMosjeSlot((MOSJES as any[])[3], { level: 1, mp: 50 });
    second.entryProtected = true;
    slots[1] = second;
    const entry = PIECIE_TARGETS.piecie_leipe_swap || PIECIE_TARGETS.piecie_affoe;
    expect(entry.some((t: any) => t.who === 'opp')).toBe(true);
    const opts = piecieTargetOptions(s, 'player_1', 'piecie_affoe');
    const opp = opts.find((o: any) => o.who === 'opp');
    expect(opp.options.map((o: any) => o.slotIndex)).toEqual([0]);
  });
});

describe('Phase 59 data rulings', () => {
  const get = (id: string) => (PIECIES as any[]).find((p) => p.id === id);
  it('Tikker and MP Hemorrhage Stay; Amplifier and Synergy Field do not give MP', () => {
    expect(get('piecie_tikker').stays).toBeTruthy();
    expect(get('piecie_mp_hemorrhage').stays).toBeTruthy();
    expect(get('piecie_mp_amplifier').givesMP).toBe(false);
    expect(get('piecie_synergy_field').givesMP).toBe(false);
    expect(GIVES_MP_PIECIES.has('piecie_mp_amplifier')).toBe(false);
    expect(GIVES_MP_PIECIES.has('piecie_synergy_field')).toBe(false);
  });
});
