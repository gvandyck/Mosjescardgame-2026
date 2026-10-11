// resolveMpLoss — base -> reducers -> caps -> round to 5, floor 0 (§2g).
// Returns the final amount; never touches slot.mp. 0 means "no loss".
import { roundToFive } from '../roundToFive.js';
import { LOSS_STEPS } from './lossSteps.js';

export function resolveMpLoss(ctx) {
  let amount = ctx.amount;
  for (const group of [LOSS_STEPS.base, LOSS_STEPS.reducers, LOSS_STEPS.caps]) {
    for (const step of group) amount = step({ ...ctx, amount });
  }
  return Number.isFinite(amount) ? Math.max(0, roundToFive(amount)) : 0;
}
