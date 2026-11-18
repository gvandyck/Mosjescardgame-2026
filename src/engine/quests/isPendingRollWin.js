// isPendingRollWin - does this dice result win the held roll? A Personal Quest roll (kind 'personal') uses its own
// need (pending.need); an ordinary Quest roll uses its band. Shared by every rerolling effect.
import { getQuestDef } from './getQuestDef.js';
import { isBandWin } from './isBandWin.js';
import { isPersonalQuestWin } from '../personalQuests/isPersonalQuestWin.js';

export function isPendingRollWin(pending, dice) {
	if (pending?.kind === 'personal') return isPersonalQuestWin(pending.need, dice);
	return isBandWin(getQuestDef(pending?.questId)?.band, dice, pending?.ease || 0);
}
