// isQuestBlockedByTikker - a Mosje with a Tikker Staying next to it (piece slot blockedMosjeSlot) can't attempt a
// Quest on its owner's next turn. The Tikker leaves at the end of that turn (sweepStaysSlots), which lifts the block.
export function isQuestBlockedByTikker(state, playerId, slotIndex) {
	return (state.players[playerId]?.piecieSlots || []).some(e =>
		e && e.cardId === 'piecie_tikker' && e.stays === true && e.blockedMosjeSlot === slotIndex
		&& (e.activatedRound ?? 0) < state.turnNumber);
}
