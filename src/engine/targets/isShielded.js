// isShielded - Blensen!: until the end of that turn the opponent's cards can't target `ownerId`'s Mosjes (attacks still can).
export function isShielded(state, ownerId, actingPlayerId) {
	const sh = state?.blensenShield;
	return !!sh && sh.playerId === ownerId && sh.turnNumber === state.turnNumber && actingPlayerId !== ownerId;
}
