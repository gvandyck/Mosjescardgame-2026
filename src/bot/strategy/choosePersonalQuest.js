// choosePersonalQuest - the bot's minimum (D-27): the first Personal Quest x Mosje (only `slotIndex` when given) the engine says is legal, or null.
import { asBotView } from './asBotView.js';
import { getPersonalQuestOptions } from '../../engine/personalQuests/getPersonalQuestOptions.js';
import { defaultPersonalQuestChoice } from './defaultPersonalQuestChoice.js';

export function choosePersonalQuest(state, playerId, slotIndex) {
	state = asBotView(state, playerId); // BOT-04: from here on `state` is the table view
	const hit = getPersonalQuestOptions(state, playerId, { choiceFor: defaultPersonalQuestChoice }).find(o => o.ok && (slotIndex === undefined || o.slotIndex === slotIndex));
	return hit ? { cardId: hit.cardId, slotIndex: hit.slotIndex, choice: defaultPersonalQuestChoice(state, playerId, hit.cardId) } : null;
}
