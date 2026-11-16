// resilientDefence — the last loss step: an ATTACK loses 5 per Res star, never below 5 (a loss already at 0 stays 0).
// Card effects (DRAIN, QUEST, ...) ignore Resilient.
import { getResilientReduction } from '../../attack/getResilientReduction.js';
import { MIN_ATTACK_LOSS } from '../../attack/attackRules.js';

export function resilientDefence(ctx) {
  if (ctx.source !== 'ATTACK' || !(ctx.amount > 0)) return ctx.amount;
  return Math.max(MIN_ATTACK_LOSS, ctx.amount - getResilientReduction(ctx.slot));
}
