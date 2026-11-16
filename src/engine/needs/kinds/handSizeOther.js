// handSizeOther { count } - at least that many cards in hand besides the card itself (ctx.cardId).
export const handSizeOther = {
	check(ctx, need) {
		const hand = ctx.state.players[ctx.playerId]?.hand || [];
		const others = hand.length - (hand.some(c => c.cardId === ctx.cardId) ? 1 : 0);
		if (others >= need.count) return { ok: true };
		return { ok: false, reason: `Needs: ${need.count}+ other cards in your hand` };
	},
};
