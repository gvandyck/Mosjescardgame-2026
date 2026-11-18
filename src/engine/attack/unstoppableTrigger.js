// Unstoppable (Alyssa, The Bulldozer): 20 or more MP lost from attacks in one turn -> +25 MP and +10 Power until the end
// of her owner's next turn (a timed effect), once per turn.
import { gainMP } from '../mpManager.js';
import { addTimedEffect } from '../durations/addTimedEffect.js';
import { DURATIONS } from '../durations/durationKinds.js';

export function unstoppableTrigger(ctx) {
  let s = ctx.state;
  const t = s.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
  if (t?.cardId !== 'mosje_alyssa_bulldozer' || !(ctx.final > 0)) return s;
  t.takenByAttacksThisTurn = (t.takenByAttacksThisTurn || 0) + ctx.final;
  if (t.takenByAttacksThisTurn >= 20 && !t.unstoppableFired) {
    t.unstoppableFired = true;
    addTimedEffect(s, {
      target: { playerId: ctx.targetPlayerId, slotIndex: ctx.targetSlotIndex, cardId: t.cardId },
      kind: 'power', amount: 10, duration: DURATIONS.UNTIL_END_OF_NEXT_TURN, ownerId: ctx.targetPlayerId, sourceCardId: t.cardId,
    });
    s = gainMP(s, ctx.targetPlayerId, ctx.targetSlotIndex, 25, 'UNSTOPPABLE');
  }
  return s;
}
