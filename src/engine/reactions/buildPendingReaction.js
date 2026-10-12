// buildPendingReaction — clone `state` with state.pendingReaction set to the first window; the rest is queued.
export function buildPendingReaction(state, actorId, action, windows) {
	const [first, ...rest] = windows;
	const next = JSON.parse(JSON.stringify(state));
	next.pendingReaction = {
		id: `r${state.turnNumber}-${actorId}-${action.type}`, moments: first.moments, responderId: first.responderId, actorId,
		eligible: first.eligible, preview: first.preview || { getemt: [], toWelloe: false, mpLoss: {} },
		action: { type: action.type, args: JSON.parse(JSON.stringify(action.args)) },
		queue: rest.map(w => ({ responderId: w.responderId, moments: w.moments })),
	};
	return next;
}
