// staysBoundGone - true when a Mosje a Stays Piecie is bound to has left play (entry.boundTo: [{ playerId, slotIndex, cardId }]).
export function staysBoundGone(state, entry) {
	return (entry.boundTo || []).some((b) => {
		const slot = state.players[b.playerId]?.activeSlots?.[b.slotIndex];
		return !slot || slot.isDefeated || slot.cardId !== b.cardId;
	});
}
