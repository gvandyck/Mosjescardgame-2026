// checkQuestCondition — Gated/Trained/condition gate. Pay-type costs are checked by payQuestCost.
import { QUEST_CONDITIONS } from './questConditions.js';
import { dingetjeForTrait } from './dingetjeForTrait.js';
import { isQuestBlockedByTikker } from './isQuestBlockedByTikker.js';

export function checkQuestCondition(state, playerId, slotIndex, quest, costChoice) {
	if (isQuestBlockedByTikker(state, playerId, slotIndex)) {
		return { ok: false, error: 'This Mosje cannot Quest this turn (Tikker)' };
	}
	const test = quest?.costId ? QUEST_CONDITIONS[quest.costId] : null;
	if (!test) return { ok: true };
	const slot = state.players[playerId]?.activeSlots?.[slotIndex];
	if (test({ state, playerId, slot, quest })) return { ok: true };
	// Dingetje toch?! counts as one failing trait requirement (discarded in rollQuestAttempt).
	const dingetje = dingetjeForTrait(state, playerId, quest, costChoice);
	if (dingetje) return { ok: true, dingetje };
	return { ok: false, error: `Condition not met: ${quest.costText || quest.costId}` };
}
