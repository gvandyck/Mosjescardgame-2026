// settleReactions — answers every open reaction window whose responder is a bot. Stops at a human's window.
// Returns { state, waiting }. Max 8 windows per call: after that every window is passed (no endless loops).
import { resolveReaction } from '../engine/reactions/resolveReaction.js';
import { chooseReaction } from './strategy/chooseReaction.js';

export function settleReactions(state, humanIds = []) {
	let n = 0;
	while (state.pendingReaction) {
		const who = state.pendingReaction.responderId;
		if (humanIds.includes(who)) return { state, waiting: true };
		let r = resolveReaction(state, who, n++ < 8 ? chooseReaction(state, who) : null);
		if (!r.ok) r = resolveReaction(state, who, null);
		if (r.ok) { state = r.state; continue; }
		state = { ...state }; delete state.pendingReaction; // malformed state: never loop
	}
	return { state, waiting: false };
}
