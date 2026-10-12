// settleReactions (UI) — answer every open reaction window: the local human is prompted, a bot answers at once,
// a remote online responder is auto-passed (KNOWN GAP). Returns the settled state. Max 8 windows (never loops).
import { resolveReaction } from '../../engine/reactions/resolveReaction.js';
import { chooseReaction } from '../../bot/strategy/chooseReaction.js';
import { promptReaction } from './promptReaction.js';

export async function settleReactions(state, { localPlayerId, isOffline, modal, onLog = () => {} }) {
	for (let n = 0; state.pendingReaction; n++) {
		const who = state.pendingReaction.responderId;
		let card = null;
		if (n < 8) {
			if (who === localPlayerId) card = await promptReaction(modal, state, who);
			else if (isOffline) card = chooseReaction(state, who);
			else onLog('KNOWN GAP (online 2.0): reaction auto-passed');
		}
		let r = resolveReaction(state, who, card);
		if (!r.ok) r = resolveReaction(state, who, null);
		if (r.ok) { state = r.state; continue; }
		state = { ...state }; delete state.pendingReaction;
	}
	return state;
}
