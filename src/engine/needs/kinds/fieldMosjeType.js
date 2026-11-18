// fieldMosjeType { type } - the player has a live Mosje of that subtype (PHYSICAL / DIGITAL / CREATIVE) on the field.
export const fieldMosjeType = {
	check(ctx, need) {
		const has = (ctx.state.players[ctx.playerId]?.activeSlots || []).some(s => s && !s.isDefeated && s.subtype === need.type);
		if (has) return { ok: true };
		const t = String(need.type);
		return { ok: false, reason: `Needs a ${t.charAt(0)}${t.slice(1).toLowerCase()} Mosje` };
	},
};
