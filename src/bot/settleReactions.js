// settleReactions — answers every open reaction window whose responder is a bot. Stops at a human's window.
// Returns { state, waiting }. Max 8 windows per call: after that every window is passed (no endless loops).
import { resolveReaction } from '../engine/reactions/resolveReaction.js';
import { chooseReaction } from './strategy/chooseReaction.js';
import { settleMosjePauses } from './settleMosjePauses.js';

export function settleReactions(state, humanIds = []) {
	let n = 0;
	while (state.pendingReaction || state.pendingChoice?.hook === 'snelle') {
		if (!state.pendingReaction) { // a Snelle paused on its pick: the bot answers, a human's pick waits
			const out = settleMosjePauses(state, humanIds);
			if (out.waiting) return { state: out.state, waiting: true };
			if (out.state === state || n > 20) break;
			state = out.state; n++;
			continue;
		}
		const who = state.pendingReaction.responderId;
		if (humanIds.includes(who)) return { state, waiting: true };
		let r = resolveReaction(state, who, n++ < 8 ? chooseReaction(state, who) : null);
		if (!r.ok) r = resolveReaction(state, who, null);
		if (r.ok) { state = r.state; continue; }
		state = { ...state }; delete state.pendingReaction; // malformed state: never loop
	}
	return { state, waiting: false };
}
