// getPersonalQuestDef - look up a Personal Quest row by card id (null when there is none).
import { PERSONAL_QUESTS } from '../../data/personalQuests.js';

export function getPersonalQuestDef(cardId) {
	return PERSONAL_QUESTS.find(q => q.id === cardId) || null;
}
