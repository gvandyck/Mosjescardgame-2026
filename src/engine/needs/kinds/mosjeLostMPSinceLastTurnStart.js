// mosjeLostMPSinceLastTurnStart - the Mosje lost MP since the start of its owner's last turn: two windows on the slot,
// mpLostWindowNow (since this turn started) and mpLostWindowPrev (the window before). Set where MP is really lost.
export const mosjeLostMPSinceLastTurnStart = {
	check(ctx) {
		const slot = ctx.state.players[ctx.playerId]?.activeSlots?.[ctx.slotIndex];
		if (slot && (slot.mpLostWindowNow || slot.mpLostWindowPrev)) return { ok: true };
		return { ok: false, reason: 'Needs: this Mosje lost MP since the start of your last turn' };
	},
};
