// markTargeted - the Target step (rules §9, D-20): records which Mosje an effect targets, on the cloned state the effect
// works on. The reaction window reads the record (takeTargeted) to decide who gets the "targeted" moment.
// Mutates the state it is given; the record never outlives the action (withReactionWindow removes it).
export function markTargeted(state, targetPlayerId, slotIndex) {
	if (!state || !targetPlayerId || !Number.isInteger(slotIndex) || slotIndex < 0) return state;
	state.targetedThisAction = [...(state.targetedThisAction || []), { playerId: targetPlayerId, slotIndex }];
	return state;
}
