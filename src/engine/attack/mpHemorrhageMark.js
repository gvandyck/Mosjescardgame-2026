// MP Hemorrhage: the first Mosje the armed attacker attacks gets a mark.
// KNOWN GAP (fix in Phase 59): the Piecie effect that arms it and the end-of-next-turn 10 MP loss.
export function mpHemorrhageMark(ctx) {
  const a = ctx.state.players[ctx.attackerPlayerId].activeSlots[ctx.attackerSlotIndex];
  if (!a?.mpHemorrhageArmed) return ctx.state;
  const t = ctx.state.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
  if (t) t.hemorrhageMark = { byPlayerId: ctx.attackerPlayerId };
  a.mpHemorrhageArmed = false;
  return ctx.state;
}
