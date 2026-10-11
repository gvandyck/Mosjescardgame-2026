import { roundToFive } from '../../roundToFive.js';

// MP_LOSS_HALVED status: halve the loss (stays on the 5-grid), spend one turn.
export function halvedLossReducer(ctx) {
  const effect = ctx.slot?.statusEffects?.find(e => e.type === 'MP_LOSS_HALVED' && e.turnsLeft > 0);
  if (!effect) return ctx.amount;
  const next = roundToFive(ctx.amount / 2);
  effect.turnsLeft -= 1;
  console.log('[MP] MP_LOSS_HALVED: loss halved to', next);
  return next;
}
