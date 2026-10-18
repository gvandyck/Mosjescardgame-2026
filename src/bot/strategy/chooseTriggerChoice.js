// chooseTriggerChoice — the bot's answer to a pendingChoice it owns (a Mosje trigger or Piecie that needs a pick).
// A 'mosje' pick is judged by pickMosjeOption (hit the Mosje it hurts most, protect a Level 3); any other pick takes the
// first option. Returns undefined when the choice is not the bot's (or has no options).
import { asBotView } from './asBotView.js';
import { pickMosjeOption } from './pickMosjeOption.js';

export function chooseTriggerChoice(state, botId) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const pc = state.pendingChoice;
	if (!pc || pc.playerId !== botId || !Array.isArray(pc.options) || pc.options.length === 0) return undefined;
	if (pc.choiceKind === 'mosje') return pickMosjeOption(state, botId, pc) ?? pc.options[0];
	return pc.options[0];
}
