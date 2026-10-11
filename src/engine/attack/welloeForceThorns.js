// Welloe Force: each time an opponent Mosje attacks the owner's Mosje, the attacker loses 15.
import { loseMP } from '../mpManager.js';

export function welloeForceThorns(ctx) {
  const wf = ctx.state._welloeForceActive;
  if (!wf || wf.ownerId !== ctx.targetPlayerId) return ctx.state;
  return loseMP(ctx.state, ctx.attackerPlayerId, ctx.attackerSlotIndex, 15, 'WELLOE_FORCE', false, ctx.targetPlayerId);
}
