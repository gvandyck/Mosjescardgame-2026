// Momentum Stabilizer: a single loss is capped at 30 (applied after reducers, §2g). Fresh Mosjes ignore Places.
import { isFresh } from '../../fresh/isFresh.js';

export function momentumStabilizerCap(ctx) {
  if (ctx.placeId === 'place_momentum_stabilizer' && !isFresh(ctx.slot)) return Math.min(ctx.amount, 30);
  return ctx.amount;
}
