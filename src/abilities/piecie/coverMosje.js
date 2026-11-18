// coverMosje - a Stays Piecie shrinks every loss of one own Mosje by `reduce` (staysBoundReducer reads entry.boundTo).
// Writes the cover onto the staying Piecie entry (ctx.slotIndex). onlyOppTurn: it counts only during the opponent's turn.
export function coverMosje(state, playerId, ctx, slotIndex, reduce, { onlyOppTurn = false } = {}) {
	const entry = ctx.slotIndex >= 0 ? state.players[playerId].piecieSlots?.[ctx.slotIndex] : null;
	const slot = state.players[playerId].activeSlots[slotIndex];
	if (!entry || !slot) return state;
	entry.boundTo = [{ playerId, slotIndex, cardId: slot.cardId, reduce, ...(onlyOppTurn ? { onlyOppTurn: true } : {}) }];
	return state;
}
