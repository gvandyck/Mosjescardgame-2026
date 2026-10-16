// settleReactions (UI) — answer every open reaction window: the local human is prompted, a bot answers at once,
// a remote online responder is auto-passed (KNOWN GAP). Returns the settled state. Max 8 windows (never loops).
import { resolveReaction } from '../../engine/reactions/resolveReaction.js';
import { chooseReaction } from '../../bot/strategy/chooseReaction.js';
import { promptReaction } from './promptReaction.js';
import { settlePendingChoice } from './settlePendingChoice.js';

export async function settleReactions(state, { localPlayerId, isOffline, modal, onLog = () => {} }) {
	for (let n = 0; state.pendingReaction || state.pendingChoice?.hook === 'snelle'; n++) {
		if (!state.pendingReaction) { // a Snelle paused on its pick: ask (human) or answer (bot), then the windows / held action go on
			const humanIds = isOffline ? [localPlayerId] : Object.keys(state.players);
			const next = await settlePendingChoice({ state, localPlayerId, modal, humanIds });
			if (next === state || n > 20) break;
			state = next;
			continue;
		}
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
