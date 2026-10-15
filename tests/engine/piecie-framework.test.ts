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
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';

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

