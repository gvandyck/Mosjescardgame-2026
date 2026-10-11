// Unstoppable (Alyssa, The Bulldozer): taksed 30+ in one turn -> +25 MP and +10 Power until end of owner's next turn.
import { gainMP } from '../mpManager.js';

export function unstoppableTrigger(ctx) {
  let s = ctx.state;
  const t = s.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
  if (t?.cardId !== 'mosje_alyssa_bulldozer' || !(ctx.final > 0)) return s;
  t.takenByAttacksThisTurn = (t.takenByAttacksThisTurn || 0) + ctx.final;
  if (t.takenByAttacksThisTurn >= 30 && !t.unstoppableFired) {
    t.unstoppableFired = true;
    t.powerBoostUntilOwnerTurnEnd = { amount: 10, ownerId: ctx.targetPlayerId };
    s = gainMP(s, ctx.targetPlayerId, ctx.targetSlotIndex, 25, 'UNSTOPPABLE');
  }
  return s;
}
