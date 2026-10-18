// chooseQuestChoices — the bot's picks for a resolved Quest attempt (jab target, Vraag Aad, Parkeren Delft).
import { getJabTargets } from '../../engine/quests/getJabTargets.js';
import { valueOfLoss } from './valueOfLoss.js';
import { asBotView } from './asBotView.js';

const JAB = 10;

export function chooseQuestChoices(state, botId, pending) {
	state = asBotView(state, botId); // BOT-04: from here on `state` is the table view
	const choices = {};
	const { questId, win, discardedCardIds } = pending;
	const mine = state.players[botId];
	if (win) {
		const targets = getJabTargets(state, botId, questId, { discardedCardIds });
		const slotOf = (t) => state.players[t.playerId].activeSlots[t.slotIndex];
		// The jab goes where 10 MP hurts most (a getemt beats a plain loss); equal value goes to the lower MP.
		const best = [...targets].sort((a, b) => valueOfLoss(slotOf(b), JAB) - valueOfLoss(slotOf(a), JAB) || slotOf(a).mp - slotOf(b).mp)[0];
		if (best) choices.jabTarget = best;
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
