// chooseQuestChoices — the bot's picks for a resolved Quest attempt (jab target, Vraag Aad, Parkeren Delft).
import { getJabTargets } from '../../engine/quests/getJabTargets.js';
import { asBotView } from './asBotView.js';

export function chooseQuestChoices(state, botId, pending) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const choices = {};
	const { questId, win, discardedCardIds } = pending;
	const mine = state.players[botId];
	if (win) {
		const targets = getJabTargets(state, botId, questId, { discardedCardIds });
		const lowest = [...targets].sort((a, b) =>
			state.players[a.playerId].activeSlots[a.slotIndex].mp - state.players[b.playerId].activeSlots[b.slotIndex].mp)[0];
		if (lowest) choices.jabTarget = lowest;
		if (questId === 'quest_parkeren_delft') {
			const picks = [];
			for (const [playerId, p] of Object.entries(state.players)) {
				if (playerId === botId) continue;
				(p.graveyard || []).forEach((_, graveyardIndex) => picks.push({ playerId, graveyardIndex }));
			}
			choices.parkerenRemove = picks.slice(0, 3);
		}
	} else if (questId === 'quest_geen_raad_vraag_aad' && (mine.hand || []).length > 0) {
		const cheapest = mine.hand.findIndex(c => c.type !== 'MOSJE');
		if (cheapest >= 0) choices.vraagAadDiscardHandIndex = cheapest;
	}
	return choices;
}
