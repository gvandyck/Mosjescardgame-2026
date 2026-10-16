// scheduleEndOfTurnLoss - "at the end of the turn / of your next turn it loses N MP": queues a loss on the owner's
// endOfTurnLosses (paid by runEndOfTurnLosses when the owner's turn ends in round dueRound or later). The target may be
// an opponent Mosje (targetPlayerId). Mutates the given, already cloned, state.
export function scheduleEndOfTurnLoss(state, ownerId, { targetPlayerId = ownerId, slotIndex, amount, dueRound }) {
	const slot = state.players[targetPlayerId]?.activeSlots?.[slotIndex];
	if (!slot) return;
	const owner = state.players[ownerId];
	owner.endOfTurnLosses = [...(owner.endOfTurnLosses || []), {
		slotIndex, cardId: slot.cardId, amount, dueTurnOf: ownerId, dueRound, targetPlayerId,
	}];
}
