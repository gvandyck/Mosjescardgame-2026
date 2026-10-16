// Momentum Diefje: if the boosted attacker made a Mosje lose MP this turn, it gains 20.
// effect_momentum_diefje sets slot.momentumDiefjeThisTurn (cleared by expireThisTurnEffects).
import { gainMP } from '../mpManager.js';

export function momentumDiefjeGain(ctx) {
  const a = ctx.state.players[ctx.attackerPlayerId].activeSlots[ctx.attackerSlotIndex];
  if (!a?.momentumDiefjeThisTurn || !(ctx.final > 0)) return ctx.state;
  return gainMP(ctx.state, ctx.attackerPlayerId, ctx.attackerSlotIndex, 20, 'MOMENTUM_DIEFJE');
}
