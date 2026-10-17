// revealCards - hidden information (EFX-07). A card that lets a player look at cards they normally can't see
// records WHAT it shows in state.revealed[viewerId] = [{ source, cardIds, turnNumber }]. Nothing else about the
// opponent's hand is added to state, and entries are keyed by viewer so online play can strip other viewers' entries.
// Mutates the (already cloned) state it is given and returns it. Entries of an earlier turn are dropped on write.
export function revealCards(state, viewerId, source, cardIds) {
	const turnNumber = state.turnNumber;
	const mine = (state.revealed?.[viewerId] || []).filter(e => e.turnNumber === turnNumber);
	state.revealed = { ...(state.revealed || {}), [viewerId]: [...mine, { source, cardIds: [...cardIds], turnNumber }] };
	return state;
}
