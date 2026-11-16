// Phase 70-05 (D-22): costs paid on activation through one module, with the MP-cost floor.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/abilities/piecieEffects.js', async (orig) => {
  const real: any = await orig();
  return {
    ...real,
    // records who paid, so the test can see ctx.costPaidBy and that MP was already gone
    effect_test_cost: (state: any, playerId: string, ctx: any = {}) => {
      const s = JSON.parse(JSON.stringify(state));
      s.players[playerId].testPaidBy = ctx.costPaidBy ?? null;
      s.players[playerId].testMpSeen = s.players[playerId].activeSlots.map((x: any) => x && x.mp);
      s.players[playerId].testRuns = (s.players[playerId].testRuns || 0) + 1;
      return s;
    },
  };
});

// @ts-ignore JS modules
import { resolvePiecieActivation, activatePiecie } from '../../src/engine/turnManager.js';
// @ts-ignore
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
// @ts-ignore
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
// @ts-ignore
import { piecieActivationGate } from '../../src/engine/table/piecieActivationGate.js';
// @ts-ignore
import { canPayMpCost } from '../../src/engine/costs/canPayMpCost.js';
// @ts-ignore
import { payMpCost } from '../../src/engine/costs/payMpCost.js';
// @ts-ignore
import { canPayCosts } from '../../src/engine/costs/canPayCosts.js';
// @ts-ignore
import { payCosts } from '../../src/engine/costs/payCosts.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { makePiecieState } from '../helpers/makePiecieState.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';

const other = () => MOSJES.find((m: any) => m.id !== 'mosje_gandoe_wizard' && m.id !== 'mosje_jeffrey');
const second = (mp: number) => { const s = createMosjeSlot(other(), { level: 1, mp }); s.entryProtected = false; return s; };
const pileIds = (s: any, pid = 'player_1') => (s.players[pid].graveyard || []).map((e: any) => e.cardId);

const def = (cost: any[]) => ({
  id: 'piecie_kannetje_melk', name: 'Test', effectId: 'effect_test_cost', cost: 0, tags: ['TEST'], stays: null, activationCost: cost,
});

function board(firstMp: number, secondMp?: number) {
  const s = makePiecieState({ piecieId: 'piecie_kannetje_melk', own: { mp: firstMp } });
  s.players.player_1.piecieSlots[0].faceDown = false;
  s.players.player_1.energy = 5;
  if (secondMp !== undefined) s.players.player_1.activeSlots[1] = second(secondMp);
  return s;
}

describe('MP cost floor', () => {
  it('canPayMpCost: must stay above 0', () => {
    expect(canPayMpCost({ mp: 15 }, 10)).toBe(true);
    expect(canPayMpCost({ mp: 10 }, 10)).toBe(false);
    expect(canPayMpCost({ mp: 5 }, 10)).toBe(false);
    expect(canPayMpCost({ mp: 50, isDefeated: true }, 10)).toBe(false);
    expect(canPayMpCost(null, 10)).toBe(false);
  });
  it('payMpCost takes exactly the amount and counts as lost MP, ignoring every reducer', () => {
    const slot: any = { mp: 30, mpLostThisTurn: 5, shield: 99, resilient: 3 };
    payMpCost(slot, 10);
    expect(slot.mp).toBe(20);
    expect(slot.mpLostThisTurn).toBe(15);
    expect(slot.mp % 5).toBe(0);
  });
});

describe('canPayCosts / payCosts', () => {
  it('mpLoss pays from the Mosje at slotIndex; refuses without changing anything', () => {
    const s = board(10);
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    expect(canPayCosts(ctx, [{ kind: 'mpLoss', amount: 10 }], {}).ok).toBe(false);
    const r = payCosts(ctx, [{ kind: 'mpLoss', amount: 10 }], {});
    expect(r.ok).toBe(false);
    expect(r.reason).toBeTruthy();
    expect(s.players.player_1.activeSlots[0].mp).toBe(10);
  });
  it('energy pays; refuses when short and changes nothing (even for the costs listed before it)', () => {
    const s = board(30);
    s.players.player_1.energy = 1;
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    const r = payCosts(ctx, [{ kind: 'mpLoss', amount: 10 }, { kind: 'energy', amount: 2 }], {});
    expect(r.ok).toBe(false);
    expect(s.players.player_1.activeSlots[0].mp).toBe(30);
    expect(s.players.player_1.energy).toBe(1);
    s.players.player_1.energy = 3;
    expect(payCosts(ctx, [{ kind: 'mpLoss', amount: 10 }, { kind: 'energy', amount: 2 }], {}).ok).toBe(true);
    expect(s.players.player_1.energy).toBe(1);
    expect(s.players.player_1.activeSlots[0].mp).toBe(20);
  });
  it('energyAny pays choice.energy, 0 allowed, never more than the player has', () => {
    const s = board(30);
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    expect(payCosts(ctx, [{ kind: 'energyAny' }], { energy: 0 }).ok).toBe(true);
    expect(s.players.player_1.energy).toBe(5);
    expect(payCosts(ctx, [{ kind: 'energyAny' }], { energy: 9 }).ok).toBe(false);
    expect(s.players.player_1.energy).toBe(5);
    expect(payCosts(ctx, [{ kind: 'energyAny' }], { energy: 3 }).ok).toBe(true);
    expect(s.players.player_1.energy).toBe(2);
  });
  it('discardReadyPiecie: slot or attached, choice or first; paid cards are in the pile', () => {
    const s = board(30);
    const p = s.players.player_1;
    p.piecieSlots[1] = { cardId: 'piecie_dumbbells', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
    p.activeSlots[0].attachments = [{ cardId: 'piecie_rugbybal', attachedTurn: 1 }];
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    expect(canPayCosts(ctx, [{ kind: 'discardReadyPiecie', tag: 'gear', count: 2 }], {}).ok).toBe(true);
    expect(canPayCosts(ctx, [{ kind: 'discardReadyPiecie', tag: 'gear', count: 3 }], {}).ok).toBe(false);
    const attached = { zone: 'attached', mosjeSlotIndex: 0, attachIndex: 0, cardId: 'piecie_rugbybal' };
    const r = payCosts(ctx, [{ kind: 'discardReadyPiecie', tag: 'gear', count: 1 }], { readyPiecies: [attached] });
    expect(r.ok).toBe(true);
    expect(p.activeSlots[0].attachments).toEqual([]);
    expect(p.piecieSlots[1]).toBeTruthy();
    expect(pileIds(s)).toEqual(['piecie_rugbybal']);
    // default: the first one that qualifies
    expect(payCosts(ctx, [{ kind: 'discardReadyPiecie', tag: 'gear', count: 1 }], {}).ok).toBe(true);
    expect(p.piecieSlots[1]).toBeNull();
    expect(pileIds(s)).toEqual(['piecie_rugbybal', 'piecie_dumbbells']);
  });
  it('discardReadyPiecie refuses a choice that is not a qualifying ready card (T-70-07)', () => {
    const s = board(30);
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    const fake = { zone: 'slot', slotIndex: 2, cardId: 'piecie_dumbbells' };
    const r = payCosts(ctx, [{ kind: 'discardReadyPiecie', tag: 'gear', count: 1 }], { readyPiecies: [fake] });
    expect(r.ok).toBe(false);
    expect(pileIds(s)).toEqual([]);
  });
  it('discardFromHand: by tag or type, by choice or first; never the card being paid for', () => {
    const s = board(30);
    const p = s.players.player_1;
    p.hand = [
      { cardId: 'piecie_dumbbells', type: 'PIECIE' },
      { cardId: 'piecie_rugbybal', type: 'PIECIE' },
      { cardId: 'mosje_jeffrey', type: 'MOSJE' },
    ];
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    expect(canPayCosts(ctx, [{ kind: 'discardFromHand', type: 'PIECIE', count: 3 }], {}).ok).toBe(false);
    expect(canPayCosts({ ...ctx, excludeCardId: 'piecie_rugbybal' }, [{ kind: 'discardFromHand', tag: 'gear', count: 2 }], {}).ok).toBe(false);
    expect(payCosts(ctx, [{ kind: 'discardFromHand', tag: 'gear', count: 1 }], { handCardIds: ['piecie_rugbybal'] }).ok).toBe(true);
    expect(p.hand.map((c: any) => c.cardId)).toEqual(['piecie_dumbbells', 'mosje_jeffrey']);
    expect(pileIds(s)).toEqual(['piecie_rugbybal']);
    expect(payCosts(ctx, [{ kind: 'discardFromHand', type: 'MOSJE', count: 1 }], {}).ok).toBe(true);
    expect(p.hand.map((c: any) => c.cardId)).toEqual(['piecie_dumbbells']);
    // a chosen card that does not qualify is refused
    expect(payCosts(ctx, [{ kind: 'discardFromHand', tag: 'gear', count: 1 }], { handCardIds: ['mosje_jeffrey'] }).ok).toBe(false);
  });
  it('an unknown kind is refused with a reason, never ignored', () => {
    const s = board(30);
    const ctx = { state: s, playerId: 'player_1', slotIndex: 0 };
    const r = payCosts(ctx, [{ kind: 'sacrificeGoat', amount: 1 }], {});
    expect(r.ok).toBe(false);
    expect(String(r.reason)).toMatch(/sacrificeGoat/);
    expect(canPayCosts(ctx, [{ kind: 'sacrificeGoat' }], {}).ok).toBe(false);
  });
});

describe('cost step on activation', () => {
  it('two Mosjes, only the one above the floor is offered, it pays before the effect, effect sees costPaidBy', () => {
    const s = board(30, 10);
    const r = resolvePiecieActivation(s, 'player_1', 0, def([{ kind: 'mpLoss', amount: 10 }]), { free: false });
    expect(r.success).toBe(true);
    // one option only: auto-picked, no pause
    expect(r.paused).toBeFalsy();
    const p = r.state.players.player_1;
    expect(p.testPaidBy).toBe(0);
    expect(p.testMpSeen[0]).toBe(20); // already paid when the effect ran
    expect(p.activeSlots[0].mp).toBe(20);
    expect(p.activeSlots[1].mp).toBe(10);
    expect(p.activeSlots[0].mpLostThisTurn).toBe(10);
    expect(p.testRuns).toBe(1);
  });
  it('two Mosjes that can both pay: pauses on ownMosje; the answer pays once; a bad answer is refused', () => {
    const s = board(30, 25);
    const r = resolvePiecieActivation(s, 'player_1', 0, def([{ kind: 'mpLoss', amount: 10 }]), { free: false });
    expect(r.paused).toBe(true);
    const pc = r.state.pendingChoice;
    expect(pc.choiceKind).toBe('ownMosje');
    expect(pc.options.map((o: any) => o.slotIndex)).toEqual([0, 1]);
    expect(r.state.players.player_1.activeSlots[1].mp).toBe(25); // nothing paid before the answer
    expect(resolvePendingChoice(r.state, { label: 'x', slotIndex: 7 }).ok).toBe(false);
    const done = resolvePendingChoice(r.state, pc.options[1]);
    expect(done.ok).toBe(true);
    const p = done.state.players.player_1;
    expect(p.activeSlots[1].mp).toBe(15);
    expect(p.activeSlots[0].mp).toBe(30);
    expect(p.testPaidBy).toBe(1);
    expect(p.testRuns).toBe(1);
  });
  it('the bot pays with the first Mosje that can', () => {
    const s = board(30, 25);
    const r = resolvePiecieActivation(s, 'player_1', 0, def([{ kind: 'mpLoss', amount: 10 }]), { free: false });
    const settled = settleMosjePauses(r.state, []);
    const p = settled.state.players.player_1;
    expect(p.activeSlots[0].mp).toBe(20);
    expect(p.testPaidBy).toBe(0);
  });
  it('the gate: nobody above the floor means a reason and no Energy spent', () => {
    const s = board(10, 5);
    const d = def([{ kind: 'mpLoss', amount: 10 }]);
    expect(String(piecieActivationGate(s, 'player_1', d))).toMatch(/pay/i);
    const ok = board(30, 5);
    expect(piecieActivationGate(ok, 'player_1', d)).toBeNull();
    expect(piecieActivationGate(ok, 'player_1', { ...d, activationCost: undefined })).toBeNull();
  });
  it('activatePiecie on a real card with no activationCost is unchanged', () => {
    const s = makePiecieState({ piecieId: 'piecie_kannetje_melk' });
    s.players.player_1.energy = 5;
    const r = activatePiecie(s, 'player_1', 0);
    expect(r.success).toBe(true);
  });
});
