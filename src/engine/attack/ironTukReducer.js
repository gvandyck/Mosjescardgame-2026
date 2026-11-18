// Iron Tuk (Michelle, Iron Tuk): she loses 10 less MP from each attack, 15 less from Level 2. A card reduction, so it runs
// before Resilient; if it takes the whole attack away the attack does 0 (the 5 floor belongs to Resilient only).
export function ironTukReducer(ctx) {
  const t = ctx.state.players[ctx.targetPlayerId].activeSlots[ctx.targetSlotIndex];
  if (t?.cardId !== 'mosje_michelle') return ctx.amount;
  return Math.max(0, ctx.amount - (t.level >= 2 ? 15 : 10));
}
