// The Protector (Snelle) flag: one-shot flat loss reduction for this player.
export function protectorSnelleReducer(ctx) {
  const flags = ctx.state?._snelleFlags?.mpLossReduction;
  const value = flags?.[ctx.playerId];
  if (!value) return ctx.amount;
  console.log('[MP] Snelle Protector: loss reduced by', value);
  delete flags[ctx.playerId];
  return Math.max(0, ctx.amount - value);
}
