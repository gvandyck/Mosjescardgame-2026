// Welloe Force: while the card stays, each time an opponent Mosje attacks one of the owner's Mosjes the attacker loses 15.
import { loseMP } from '../mpManager.js';

export function welloeForceThorns(ctx) {
  const owner = ctx.state.players[ctx.targetPlayerId];
  const staying = (owner?.piecieSlots || []).some(e => e?.stays === true && e.cardId === 'piecie_welloe_force');
  if (!staying) return ctx.state;
  return loseMP(ctx.state, ctx.attackerPlayerId, ctx.attackerSlotIndex, 15, 'WELLOE_FORCE', false, ctx.targetPlayerId);
}
