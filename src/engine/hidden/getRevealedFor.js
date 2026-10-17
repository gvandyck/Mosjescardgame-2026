// getRevealedFor - the reveal entries `viewerId` may see right now (this turn only; older ones are stale).
export function getRevealedFor(state, viewerId) {
	return (state?.revealed?.[viewerId] || []).filter(e => e.turnNumber === state.turnNumber);
}
