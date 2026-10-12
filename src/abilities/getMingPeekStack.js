// getMingPeekStack — which Quest stack Ming's Future Sight looks at (Obby 2.0: 3 typed stacks, no shared deck).
// Picks the requested stack if it has a deck card, else the first stack that does; null when all decks are empty.
// KNOWN GAP (fix in Phase 58): the player cannot yet choose the stack in the UI; Ming's rework lives there.
export function getMingPeekStack(state, requestedId = null) {
	const stacks = state?.questStacks || {};
	if (requestedId && stacks[requestedId]?.deck?.length) return requestedId;
	return Object.keys(stacks).find(id => stacks[id]?.deck?.length) || null;
}
