// chooseTriggerChoice — the bot's answer to a pendingChoice it owns (a Mosje trigger that needs a pick).
// Plain default: the first option. Returns undefined when the choice is not the bot's (or has no options).
import { asBotView } from './asBotView.js';

export function chooseTriggerChoice(state, botId) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const pc = state.pendingChoice;
	if (!pc || pc.playerId !== botId || !Array.isArray(pc.options) || pc.options.length === 0) return undefined;
	return pc.options[0];
}
