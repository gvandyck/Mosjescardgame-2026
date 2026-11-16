// opponentHandMax { count } - the opponent has at most that many cards in hand (hand size is public).
export const opponentHandMax = {
	check(ctx, need) {
		const oppId = Object.keys(ctx.state.players).find(id => id !== ctx.playerId);
		const n = (ctx.state.players[oppId]?.hand || []).length;
		if (n <= need.count) return { ok: true };
		return { ok: false, reason: `Needs: your opponent has ${need.count} or fewer cards in hand` };
	},
};
