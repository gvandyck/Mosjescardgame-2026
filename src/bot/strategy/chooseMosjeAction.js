// chooseMosjeAction - what one Mosje does this turn: attack, Quest, or null. The choice is scoreMosjeAction's best option
// by expected value; this returns it without the value. Legality is the engine's (canMosjeTakeAction, dry-runs).
import { scoreMosjeAction } from './scoreMosjeAction.js';
import { asBotView } from './asBotView.js';

export function chooseMosjeAction(state, botId, slotIndex) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const best = scoreMosjeAction(state, botId, slotIndex);
	if (!best) return null;
	const { value, ...action } = best;
	return action;
}
