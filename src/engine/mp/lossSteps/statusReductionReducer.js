// MP_LOSS_REDUCTION status: subtract the status value, spend one turn.
export function statusReductionReducer(ctx) {
  const effect = ctx.slot?.statusEffects?.find(e => e.type === 'MP_LOSS_REDUCTION' && e.turnsLeft > 0);
  if (!effect) return ctx.amount;
  const next = Math.max(0, ctx.amount - effect.value);
  effect.turnsLeft -= 1;
  console.log('[MP] MP_LOSS_REDUCTION: loss reduced by', effect.value, '→', next);
  return next;
}
