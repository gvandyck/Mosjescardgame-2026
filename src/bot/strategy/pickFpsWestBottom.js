// pickFpsWestBottom - the bot's answer to the FPS West pause (key fps_west_bottom, CC-8): bottom a Snelle (a reaction card
// the opponent would answer with) when one is among the cards West shows, otherwise "Leave it" (index -1, costs no MP).
// Reads only the options of the bot's own pause, which are the cards revealed to it. Returns one of the options.
import { asBotView } from './asBotView.js';

export function pickFpsWestBottom(state, botId, pendingChoice) {
	asBotView(state, botId); // BOT-04: the choice below is read from the bot's own pause, never from the opponent's hand
	const options = pendingChoice?.options;
	if (!Array.isArray(options) || options.length === 0) return undefined;
	return options.find(o => typeof o?.cardId === 'string' && o.cardId.startsWith('snelle_'))
		?? options.find(o => o?.index === -1)
		?? options[0];
}
