// Zo is Natuur (2.0): Mosjes with Resilient ★★+ lose 10 MP less from attacks.
export function zoIsNatuurReducer(ctx) {
  if (ctx.placeId === 'place_zo_is_natuur' && ctx.source === 'ATTACK' && (ctx.slot?.traits?.resilient || 0) >= 2) {
    return Math.max(0, ctx.amount - 10);
  }
  return ctx.amount;
}
