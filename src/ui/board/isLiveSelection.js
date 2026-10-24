// isLiveSelection.js — is the selected own card (key { kind, slotIndex, cardId }) still the same card in the same slot of the
// current state, on an own, still running turn? The controller drops the selection the moment this turns false.
export function isLiveSelection(state, localId, sel) {
	if (!state || state.status === 'FINISHED' || state.activePlayerId !== localId || !sel) return false;
	const me = state.players?.[localId];
	if (sel.kind === 'mosje') {
		const slot = me?.activeSlots?.[sel.slotIndex];
		return !!slot && !slot.isDefeated && slot.cardId === sel.cardId;
	}
	if (sel.kind === 'piecie') return me?.piecieSlots?.[sel.slotIndex]?.cardId === sel.cardId;
	if (sel.kind === 'place') return !!state.activePlace && state.activePlacePlayedBy === localId;
	return false;
}
