// turnLockKey - names "this turn" for hand locks: the round plus whose turn it is.
export function turnLockKey(state) {
	return `${state.turnNumber}:${state.activePlayerId}`;
}
