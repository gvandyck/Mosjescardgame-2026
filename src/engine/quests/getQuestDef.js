// getQuestDef — look up a Quest row by id.
import { QUESTS } from '../../data/quests.js';

export function getQuestDef(questId) {
	return QUESTS.find(q => q.id === questId) || null;
}
