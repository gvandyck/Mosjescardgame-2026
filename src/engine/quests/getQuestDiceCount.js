// getQuestDiceCount — base dice + all +1 sources + extra, clamped to 1..4 (E15).
import { getBaseQuestDice } from './getBaseQuestDice.js';
import { QUEST_DICE_SOURCES } from './questDiceSources.js';

export function getQuestDiceCount(state, playerId, slot, quest, { extra = 0 } = {}) {
	const ctx = { state, playerId, slot, quest };
	const bonus = QUEST_DICE_SOURCES.reduce((sum, fn) => sum + fn(ctx), 0);
	return Math.min(4, Math.max(1, getBaseQuestDice(slot, quest) + bonus + extra));
}
