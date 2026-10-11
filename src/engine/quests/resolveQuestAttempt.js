// resolveQuestAttempt — step 2: apply MP, hooks, stack advance. `pending` comes from rollQuestAttempt.
import { gainMP, loseMP } from '../mpManager.js';
import { checkVictory } from '../victoryChecker.js';
import { runQuestOutcomeHooks } from '../../abilities/questLogic.js';
import { getQuestDef } from './getQuestDef.js';
import { advanceQuestStack } from './advanceQuestStack.js';

export function resolveQuestAttempt(state, pending, choices = {}) {
	const { playerId, slotIndex, stackId, questId, win, dice } = pending;
	const quest = getQuestDef(questId);
	if (!quest || state.questStacks?.[stackId]?.faceUp !== questId) {
		return { ok: false, state, error: 'That Quest is no longer face-up' };
	}
	let s = JSON.parse(JSON.stringify(state));
	const name = s.players[playerId].activeSlots[slotIndex]?.name;
	if (win) s = gainMP(s, playerId, slotIndex, quest.win, 'QUEST');
	else s = loseMP(s, playerId, slotIndex, Math.abs(quest.lose), 'QUEST', false, playerId);
	s = runQuestOutcomeHooks(s, playerId, slotIndex, quest, win, win ? quest.win : 0);
	s = advanceQuestStack(s, stackId, win ? 'win' : 'fail');
	s = checkVictory(s);
	console.log(`[QUEST] ${quest.name}: ${name} dice [${dice.join(',')}] band ${quest.band} -> ${win ? 'WIN' : 'FAIL'}`);
	return { ok: true, state: s, win, choices };
}
