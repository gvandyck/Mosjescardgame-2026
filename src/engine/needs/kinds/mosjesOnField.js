// mosjesOnField { count } - the player has at least that many Mosjes on the field.
export const mosjesOnField = {
	check(ctx, need) {
		const n = (ctx.state.players[ctx.playerId]?.activeSlots || []).filter(s => s && !s.isDefeated).length;
		if (n >= need.count) return { ok: true };
		return { ok: false, reason: `Needs: ${need.count} Mosjes on your field` };
	},
};
