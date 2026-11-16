// getQuestDiceCount — base dice + all +1 sources + extra, clamped to 1..MAX_QUEST_DICE (6, rules §6).
import { getBaseQuestDice } from './getBaseQuestDice.js';
import { QUEST_DICE_SOURCES } from './questDiceSources.js';
import { MAX_QUEST_DICE } from './questRules.js';

export function getQuestDiceCount(state, playerId, slot, quest, { extra = 0 } = {}) {
	const ctx = { state, playerId, slot, quest };
	const bonus = QUEST_DICE_SOURCES.reduce((sum, fn) => sum + fn(ctx), 0);
	return Math.min(MAX_QUEST_DICE, Math.max(1, getBaseQuestDice(slot, quest) + bonus + extra));
}
