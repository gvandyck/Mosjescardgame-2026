// RULE-10: "you / your Mosje" effects hit the Mosje the player chose, not the first on the field.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-expect-error — JS module
import * as piecie from '../../src/abilities/piecieEffects.js';
// @ts-expect-error — JS module
import * as abilities from '../../src/abilities/mosjeAbilities.js';
// @ts-expect-error — JS module
import { OWN_TARGET_EFFECT_IDS } from '../../src/engine/targets/ownTargetEffects.js';
// @ts-expect-error — JS module
import { resolveOppTargetSlot } from '../../src/engine/targets/resolveOppTargetSlot.js';

const slot = (id: string, mp = 50, extra = {}) => ({
  cardId: id, name: id, mp, level: 1, isDefeated: false, statusEffects: [], traits: {}, entryProtected: false, ...extra,
});
const twoMosjes = (pending: any = {}) =>
  makeEngineState({
    turnNumber: 4,
    players: { player_1: { activeSlots: [slot('mosje_a'), slot('mosje_b')] }, player_2: { activeSlots: [slot('mosje_x'), null] } },
    _pendingTargets: pending,
  });

describe('own-target choice', () => {
  it('kannetje melk gains on the chosen slot and consumes the choice', () => {
    const out = (piecie as any).effect_kannetje_melk(twoMosjes({ own_slot_index: 1 }), 'player_1');
    expect(out.players.player_1.activeSlots[0].mp).toBe(50);
    expect(out.players.player_1.activeSlots[1].mp).toBeGreaterThan(50);
    expect(out._pendingTargets.own_slot_index).toBeUndefined();
  });

  it('every registry effect leaves the unchosen Mosje alone', () => {
    expect(OWN_TARGET_EFFECT_IDS.length).toBeGreaterThan(20);
    for (const id of OWN_TARGET_EFFECT_IDS) {
      const out = (piecie as any)[id](twoMosjes({ own_slot_index: 1 }), 'player_1');
      expect(out.players.player_1.activeSlots[0].mp, id).toBe(50);
    }
  });

  it('one Mosje in slot 1 (slot 0 empty) and no choice -> that Mosje', () => {
    const s = makeEngineState({ turnNumber: 4, players: { player_1: { activeSlots: [null, slot('mosje_b')] } } });
    const out = (piecie as any).effect_kannetje_melk(s, 'player_1');
    expect(out.players.player_1.activeSlots[1].mp).toBeGreaterThan(50);
  });

  it('opponent default skips a fresh slot; a chosen slot wins', () => {
    const s = makeEngineState({
      players: { player_2: { activeSlots: [slot('f', 50, { entryProtected: true }), slot('g')] } },
    });
    expect(resolveOppTargetSlot(s, 'player_2')).toBe(1);
    s._pendingTargets = { opp_slot_index: 0 };
    expect(resolveOppTargetSlot(s, 'player_2')).toBe(0);
  });

  it('an own choice pointing at an empty/defeated slot falls back (T-55-10)', () => {
    const out = (piecie as any).effect_kannetje_melk(twoMosjes({ own_slot_index: 5 }), 'player_1');
    expect(out.players.player_1.activeSlots[0].mp).toBeGreaterThan(50);
  });

  it('an ability acts on its own Mosje (slot 1), not slot 0', () => {
    const s = twoMosjes();
    const out = (abilities as any).ability_dj_8020_lucky_beats(s, 'player_1', 'mosje_b');
    expect(out.players.player_1.activeSlots[0].mp).toBe(50);
    expect(out.players.player_1.activeSlots[1].mp).toBeGreaterThan(50);
  });
});
