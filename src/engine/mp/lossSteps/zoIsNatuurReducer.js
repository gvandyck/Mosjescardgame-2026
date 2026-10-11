// Zo is Natuur (V4 effect kept): Resilient >= 2 caps a single loss at 25.
export function zoIsNatuurReducer(ctx) {
  if (ctx.placeId === 'place_zo_is_natuur' && (ctx.slot?.traits?.resilient || 0) >= 2) {
    return Math.min(ctx.amount, 25);
  }
  return ctx.amount;
}
