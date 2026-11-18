// questDieStep - a die bonus (or malus) for the activator's later Quest roll: any Mosje, or the picked Mosje with on: 'picked'.
import { addQuestDiceGrant } from '../../quests/addQuestDiceGrant.js';

export const questDieStep = {
	needsMosje: (step) => step.on === 'picked',
	run(state, playerId, step, { picked }) {
		const grant = { amount: step.amount, lasts: step.lasts || 'thisTurn' };
		if (step.friendAmount) grant.friendAmount = step.friendAmount;
		if (step.on === 'picked') {
			if (picked < 0) return state;
			grant.slotIndex = picked;
			grant.cardId = state.players[playerId].activeSlots[picked].cardId;
		}
		addQuestDiceGrant(state, playerId, grant);
		return state;
	},
};
