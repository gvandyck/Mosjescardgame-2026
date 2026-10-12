// applyQuestJab — the winner's jab: target loses 10 MP (QUEST_JAB). Targets outside getJabTargets are refused.
import { loseMP } from '../mpManager.js';
import { getJabTargets } from './getJabTargets.js';

export function applyQuestJab(state, winnerId, target, questId, pending = {}) {
	const ok = getJabTargets(state, winnerId, questId, pending)
		.some(t => t.playerId === target?.playerId && t.slotIndex === target?.slotIndex);
	if (!ok) return state;
	return loseMP(state, target.playerId, target.slotIndex, 10, 'QUEST_JAB', false, winnerId);
}
