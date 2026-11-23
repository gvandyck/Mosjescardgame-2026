// choosePersonalQuest - the legal Personal Quest x Mosje (only `slotIndex` when given) with the best win chance (CC-4), or null.
// A tie keeps the engine's first pair. The bot never skips a legal attempt.
import { asBotView } from './asBotView.js';
import { getPersonalQuestOptions } from '../../engine/personalQuests/getPersonalQuestOptions.js';
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';
import { getPersonalQuestDice } from '../../engine/personalQuests/getPersonalQuestDice.js';
import { defaultPersonalQuestChoice } from './defaultPersonalQuestChoice.js';
import { personalQuestWinChance } from './personalQuestWinChance.js';

function chanceOf(state, playerId, o, choice) {
	const def = getPersonalQuestDef(o.cardId);
	const energyPaid = (def?.pay || []).some(c => c.kind === 'energyAny') ? Number(choice.energy) || 0 : 0;
	const slot = state.players[playerId].activeSlots[o.slotIndex];
	return personalQuestWinChance(def.roll.need, getPersonalQuestDice(state, playerId, slot, def, { energyPaid }));
}

export function choosePersonalQuest(state, playerId, slotIndex) {
	state = asBotView(state, playerId); // BOT-04: from here on `state` is the table view
	let best = null;
	for (const o of getPersonalQuestOptions(state, playerId, { choiceFor: defaultPersonalQuestChoice })) {
		if (!o.ok || (slotIndex !== undefined && o.slotIndex !== slotIndex)) continue;
		const choice = defaultPersonalQuestChoice(state, playerId, o.cardId);
		const chance = chanceOf(state, playerId, o, choice);
		if (!best || chance > best.chance) best = { cardId: o.cardId, slotIndex: o.slotIndex, choice, chance };
	}
	return best ? { cardId: best.cardId, slotIndex: best.slotIndex, choice: best.choice } : null;
}
