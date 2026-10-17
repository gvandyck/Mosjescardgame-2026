// Zo is Natuur (2.0): Mosjes with Resilient ★★+ lose 10 MP less from attacks. Fresh Mosjes ignore Places.
import { isFresh } from '../../fresh/isFresh.js';

export function zoIsNatuurReducer(ctx) {
  if (ctx.placeId === 'place_zo_is_natuur' && ctx.source === 'ATTACK' && !isFresh(ctx.slot) && (ctx.slot?.traits?.resilient || 0) >= 2) {
    return Math.max(0, ctx.amount - 10);
  }
  return ctx.amount;
}
