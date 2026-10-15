// checkQuestCondition — Gated/Trained/condition gate. Pay-type costs are checked by payQuestCost.
import { QUEST_CONDITIONS } from './questConditions.js';
import { isQuestBlockedByTikker } from './isQuestBlockedByTikker.js';

export function checkQuestCondition(state, playerId, slotIndex, quest) {
	if (isQuestBlockedByTikker(state, playerId, slotIndex)) {
		return { ok: false, error: 'This Mosje cannot Quest this turn (Tikker)' };
	}
	const test = quest?.costId ? QUEST_CONDITIONS[quest.costId] : null;
	if (!test) return { ok: true };
	const slot = state.players[playerId]?.activeSlots?.[slotIndex];
	return test({ state, playerId, slot, quest })
		? { ok: true }
		: { ok: false, error: `Condition not met: ${quest.costText || quest.costId}` };
}
