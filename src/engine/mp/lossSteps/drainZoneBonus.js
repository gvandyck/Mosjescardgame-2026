// Drain Zone: DRAIN-sourced losses take +10 (base step, before any reduction).
export function drainZoneBonus(ctx) {
  if (ctx.placeId === 'place_drain_zone' && ctx.source === 'DRAIN') return ctx.amount + 10;
  return ctx.amount;
}
