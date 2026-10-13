// getMingPeekStack — which Quest stack Ming, The Predictor's Future Sight looks at (Obby 2.0: 3 typed stacks).
// The player CHOOSES the stack: the requested id must exist and still have a deck card, else null (refused).
export function getMingPeekStack(state, requestedId = null) {
	const stack = requestedId ? state?.questStacks?.[requestedId] : null;
	return stack?.deck?.length ? requestedId : null;
}
