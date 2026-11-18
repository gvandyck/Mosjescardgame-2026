// Phase 70-05 (D-20): Target is a flagged step. A card or Mosje ability with targets:true opens the targeted window for
// the owner of the targeted Mosje; an unflagged card never does; an attack never does.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/abilities/piecieEffects.js', async (orig) => {
  const real: any = await orig();
  const { resolveOppTargetSlot } = await import('../../src/engine/targets/resolveOppTargetSlot.js');
  return {
    ...real,
    // Spiegelen copies a Power and changes nothing on the target: only the recorded target can open the window
    effect_eendjes_voeren: (state: any, playerId: string) => {
      const s = JSON.parse(JSON.stringify(state));
      resolveOppTargetSlot(s, Object.keys(s.players).find((id) => id !== playerId));
      return s;
    },
  };
});

// @ts-ignore JS modules
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { activatePiecie, useMosjeAbility } from '../../src/engine/turnManager.js';
// @ts-ignore
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
// @ts-ignore
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
// @ts-ignore
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-ignore
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const attackerDef = MOSJES.find((m: any) => m.id === 'mosje_alyssa_bulldozer');
const plain = MOSJES.find((m: any) => m.id === 'mosje_ronald_chef');
const mk = (mp: number, d = plain, level = 1, extra: any = {}) => {
  const s = createMosjeSlot(d, { level, mp });
  s.entryProtected = false;
  return Object.assign(s, extra);
};
const H = (...ids: string[]) => ids.map((cardId) => ({ cardId }));
const ready = (cardId: string) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, canActivateOnTurn: 1 });

// p2 holds Jensen! (Mental 2 stars on the Mosje, as the Card List needs); p1 has the Piecie ready in slot 0.
function board(piecieId: string, { p1Slots, p2Hand = ['snelle_jensen'] }: any = {}) {
  return makeEngineState({
    turnNumber: 3,
    players: {
      player_1: { activeSlots: p1Slots || [mk(50, attackerDef), null], piecieSlots: [ready(piecieId), null, null], energy: 10 },
      player_2: { activeSlots: [mk(50, plain, 1, { traits: { mental: 2 } }), null], hand: H(...p2Hand) },
    },
  });
}

describe('the targets flag (data)', () => {
  it('only the three Piecies and the two Mosje abilities carry it', () => {
    expect(PIECIES.filter((p: any) => p.targets === true).map((p: any) => p.id).sort())
      .toEqual(['piecie_eendjes_voeren', 'piecie_kleine_taks', 'piecie_varkenspootjes']);
    expect(Object.keys(MOSJE_ABILITY_RULES).filter((k) => (MOSJE_ABILITY_RULES as any)[k].targets === true).sort())
      .toEqual(['ability_binti_cutting_words', 'ability_ronald_mastermind_master_plan']);
    expect(SNELLE_PIECIES.filter((s: any) => s.targets)).toEqual([]);
  });
});

describe('flagged Piecie', () => {
  it('opens the targeted window for the opponent when its effect marks a target and changes nothing (Spiegelen)', () => {
    const r = activatePiecie(board('piecie_eendjes_voeren'), 'player_1', 0);
    expect(r.success).toBe(true);
    const p = r.state.pendingReaction;
    expect(p.responderId).toBe('player_2');
    expect(p.moments).toContain('targeted');
    expect(p.eligible).toContain('snelle_jensen');
  });
  it('opens it for a real flagged card (Kleine Taks)', () => {
    const r = activatePiecie(board('piecie_kleine_taks'), 'player_1', 0);
    expect(r.state.pendingReaction?.moments).toContain('targeted');
  });
  it('a flagged card aimed at the actor\'s own Mosje opens no targeted window (Varkenspootjes on own Binti)', () => {
    const binti = MOSJES.find((m: any) => m.id === 'mosje_binti');
    const r = activatePiecie(board('piecie_varkenspootjes', { p1Slots: [mk(30, binti), null] }), 'player_1', 0);
    expect(r.success).toBe(true);
    expect(r.state.pendingReaction).toBeUndefined();
  });
  it('the record of who was targeted never survives the action', () => {
    const none = activatePiecie(board('piecie_kleine_taks', { p2Hand: [] }), 'player_1', 0);
    expect(none.success).toBe(true);
    expect('targetedThisAction' in none.state).toBe(false);
    const w = activatePiecie(board('piecie_kleine_taks'), 'player_1', 0).state;
    const done = resolveReaction(w, 'player_2', null);
    expect(done.ok).toBe(true);
    expect(done.state.pendingReaction).toBeUndefined();
    expect('targetedThisAction' in done.state).toBe(false);
  });
});

describe('unflagged cards and attacks', () => {
  it('an unflagged Piecie that makes an opponent Mosje lose MP: wouldLoseMp, no targeted', () => {
    const s = board('piecie_klaar_met_jou', { p2Hand: ['snelle_jammertje_gepakt', 'snelle_jensen'], p1Slots: [mk(50, attackerDef), mk(50, plain, 2)] });
    s.players.player_2.activeSlots[0].mp = 30;
    s.players.player_2.activeSlots[0].traits = { mental: 2 };
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(true);
    const p = r.state.pendingReaction;
    expect(p.moments).toEqual(expect.arrayContaining(['afterPiecieActivation', 'wouldLoseMp']));
    expect(p.moments).not.toContain('targeted');
    expect(p.eligible).not.toContain('snelle_jensen');
  });
  it('an attack on a Mosje whose owner holds Jensen! never opens the targeted window', () => {
    const s = board('piecie_kleine_taks', { p2Hand: ['snelle_perfect_dodge', 'snelle_jensen'] });
    s.players.player_2.activeSlots[0].traits = { mental: 2, strength: 2 };
    const r = attackMosje(s, 'player_1', { attackerSlotIndex: 0, targetPlayerId: 'player_2', targetSlotIndex: 0 });
    expect(r.ok).toBe(true);
    const p = r.state.pendingReaction;
    expect(p.moments).toEqual(expect.arrayContaining(['attacked']));
    expect(p.moments).not.toContain('targeted');
    expect(p.eligible).not.toContain('snelle_jensen');
  });
});

describe('Mosje ability with the flag', () => {
  const binti = MOSJES.find((m: any) => m.id === 'mosje_binti');
  // 71-16: Jensen! reacts to a Piecie or Snelle only; Counter Strikka (Mental 2 on the board) still answers a Mosje ability.
  function bintiBoard(p2Hand = ['snelle_counter_strikka']) {
    const s = board('piecie_kleine_taks', { p1Slots: [mk(50, binti), null], p2Hand });
    s.players.player_1.hand = H('piecie_kannetje_melk');
    s.players.player_1.energy = 4;
    s._pendingTargets = { hand_card: 0, opp_slot_index: 0 };
    return s;
  }
  it('opens the window for the owner of the targeted Mosje; passing replays the ability once', () => {
    const r = useMosjeAbility(bintiBoard(), 'player_1', 'mosje_binti');
    expect(r.success).toBe(true);
    expect(r.reactionPending).toBe(true);
    const p = r.state.pendingReaction;
    expect(p.responderId).toBe('player_2');
    expect(p.moments).toContain('targeted');
    expect(p.action.type).toBe('mosjeAbility');
    // nothing happened yet
    expect(r.state.players.player_1.energy).toBe(4);
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(50);
    const done = resolveReaction(r.state, 'player_2', null);
    expect(done.ok).toBe(true);
    const s = done.state;
    expect(s.pendingReaction).toBeUndefined();
    expect(s.players.player_1.energy).toBe(3); // paid once
    expect(s.players.player_1.activeSlots[0].abilityUsesThisTurn).toBe(1); // counted once
    expect(s.players.player_2.activeSlots[0].mp).toBe(40);
    expect(s.players.player_1.hand).toHaveLength(0);
    expect('targetedThisAction' in s).toBe(false);
  });
  it('without a Snelle in hand there is no window and the ability resolves at once', () => {
    const r = useMosjeAbility(bintiBoard([]), 'player_1', 'mosje_binti');
    expect(r.success).toBe(true);
    expect(r.state.pendingReaction).toBeUndefined();
    expect(r.state.players.player_2.activeSlots[0].mp).toBe(40);
    expect(r.state.players.player_1.energy).toBe(3);
    expect('targetedThisAction' in r.state).toBe(false);
  });
  it('an unflagged ability opens no window', () => {
    const tuk = MOSJES.find((m: any) => m.abilityId === 'ability_tuk_healer_healing_presence');
    const s = board('piecie_kleine_taks', { p1Slots: [mk(30, tuk), null] });
    s.players.player_1.activeSlots[0].mp = 20;
    const r = useMosjeAbility(s, 'player_1', tuk.id);
    expect(r.state.pendingReaction).toBeUndefined();
  });
});
