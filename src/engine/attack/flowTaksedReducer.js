// Flow (Parkour West): once per turn, taksed for 30+ -> loses 20 less.
export function flowTaksedReducer(ctx) {
  const t = ctx.state.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
  if (t?.cardId === 'mosje_parkour_west' && ctx.amount >= 30 && !t.flowFired) {
    t.flowFired = true;
    return ctx.amount - 20;
  }
  return ctx.amount;
}
