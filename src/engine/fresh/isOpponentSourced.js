// isOpponentSourced — true when a loss on ownerId's Mosje comes from the opponent.
// Explicit byPlayerId wins; otherwise inferred from whose turn it is.
export function isOpponentSourced(state, ownerId, byPlayerId) {
	return byPlayerId ? byPlayerId !== ownerId : state.activePlayerId !== ownerId;
}
