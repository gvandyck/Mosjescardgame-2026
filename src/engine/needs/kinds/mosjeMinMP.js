// mosjeMinMP { amount } - the Mosje at ctx.slotIndex has at least that much MP.
export const mosjeMinMP = {
	check(ctx, need) {
		const slot = ctx.state.players[ctx.playerId]?.activeSlots?.[ctx.slotIndex];
		if (slot && slot.mp >= need.amount) return { ok: true };
		return { ok: false, reason: `Needs: this Mosje has ${need.amount}+ MP` };
	},
};
