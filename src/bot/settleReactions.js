// settleReactions — answers every open reaction window whose responder is a bot. Stops at a human's window.
// Returns { state, waiting }. Max 8 windows per call: after that every window is passed (no endless loops).
import { resolveReaction } from '../engine/reactions/resolveReaction.js';
import { chooseReaction } from './strategy/chooseReaction.js';
import { settleMosjePauses } from './settleMosjePauses.js';
import { emitBotMetric } from './strategy/emitBotMetric.js';

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
		const pick = n++ < 8 ? chooseReaction(state, who) : null;
		let r = resolveReaction(state, who, pick);
		if (r.ok && pick) emitBotMetric('reaction-played', { deck: state.players[who]?.deckId, responderId: who, cardId: pick, moments: state.pendingReaction.moments }); // BOT-03: the bot played a reaction
		if (!r.ok) {
			emitBotMetric('engine-refused', { call: 'resolveReaction', cardId: pick, error: r.error }); // BOT-02: the bot's choice was refused
			r = resolveReaction(state, who, null);
		}
		if (r.ok) { state = r.state; continue; }
		emitBotMetric('engine-refused', { call: 'resolveReaction', cardId: null, error: r.error }); // BOT-02: even the pass was refused
		state = { ...state }; delete state.pendingReaction; // malformed state: never loop
	}
	return { state, waiting: false };
}
