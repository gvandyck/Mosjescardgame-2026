// Momentum Stabilizer: a single loss is capped at 30 (applied after reducers, §2g).
export function momentumStabilizerCap(ctx) {
  if (ctx.placeId === 'place_momentum_stabilizer') return Math.min(ctx.amount, 30);
  return ctx.amount;
}
