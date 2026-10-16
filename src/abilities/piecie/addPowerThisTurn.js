// addPowerThisTurn - "+N Power this turn" on one of the player's Mosjes (cleared by expireThisTurnEffects). Mutates the clone.
export function addPowerThisTurn(state, playerId, slotIndex, amount) {
	const slot = state.players[playerId].activeSlots[slotIndex];
	slot.powerBoostThisTurn = (Number(slot.powerBoostThisTurn) || 0) + amount;
}
