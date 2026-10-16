// resolveQuestAttempt — step 2: apply MP, hooks, stack advance. `pending` comes from rollQuestAttempt.
import { gainMP, loseMP } from '../mpManager.js';
import { checkVictory } from '../victoryChecker.js';
import { runQuestOutcomeHooks } from '../../abilities/questLogic.js';
import { getQuestDef } from './getQuestDef.js';
import { QUEST_EXTRAS } from './questExtras.js';
import { getJabTargets } from './getJabTargets.js';
import { applyQuestJab } from './applyQuestJab.js';
import { advanceQuestStack } from './advanceQuestStack.js';
import { runMosjeTriggers } from '../mosje/runMosjeTriggers.js';
import { applyMomentumBoostWin } from './applyMomentumBoostWin.js';
import { battleConcertRedirect } from './battleConcertRedirect.js';

export function resolveQuestAttempt(state, pending, choices = {}) {
	if (state.pendingReaction) return { ok: false, state, error: 'A reaction window is still open' };
	if (state.pendingQuestRoll) {
		pending = state.pendingQuestRoll;
		state = JSON.parse(JSON.stringify(state));
		delete state.pendingQuestRoll;
	}
	const { playerId, slotIndex, stackId, questId, win, dice } = pending;
	const quest = getQuestDef(questId);
	if (!quest || state.questStacks?.[stackId]?.faceUp !== questId) {
		return { ok: false, state, error: 'That Quest is no longer face-up' };
	}
	let s = JSON.parse(JSON.stringify(state));
	const roller = s.players[playerId];
	if (roller?.rerollGrants) roller.rerollGrants = roller.rerollGrants.filter(g => !g.forRoll); // that Quest is over
	const name = s.players[playerId].activeSlots[slotIndex]?.name;
	const extras = QUEST_EXTRAS[questId] || {};
	const slot = s.players[playerId].activeSlots[slotIndex];
	const ctx = { playerId, slotIndex, slot, quest };
	let amount = win ? quest.win + (extras.winBonus?.(ctx) || 0) : Math.abs(quest.lose);
	if (!win) {
		const v = extras.failBase?.(s, ctx, choices);
		if (v?.base != null) amount = v.base;
		amount += extras.failBonus?.(ctx) || 0;
	}
	if (win) {
		// 2.0: every questWinAmount modifier first, then ONE gain (Michelle double, Jeffrey +10, ...).
		const mod = runMosjeTriggers(s, 'questWinAmount', { playerId, slotIndex, quest, amount });
		s = mod.state;
		amount = mod.amount;
		s = gainMP(s, playerId, slotIndex, amount, 'QUEST');
	} else s = battleConcertRedirect(s, playerId, slot) || loseMP(s, playerId, slotIndex, amount, 'QUEST', false, playerId);
	s = runQuestOutcomeHooks(s, playerId, slotIndex, quest, win, win ? quest.win : 0);
	if (win) s = runMosjeTriggers(s, 'questSuccess', { playerId, slotIndex, quest, amount });
	if (win) s = applyMomentumBoostWin(s, playerId, slotIndex);
	if (win) {
		if (extras.jab) {
			const targets = getJabTargets(s, playerId, questId, pending);
			const t = targets.find(x => x.playerId === choices.jabTarget?.playerId && x.slotIndex === choices.jabTarget?.slotIndex) || targets[0];
			if (t) s = applyQuestJab(s, playerId, t, questId, pending);
		}
		if (extras.onWin) s = extras.onWin(s, ctx, choices);
	}
	s = advanceQuestStack(s, stackId, win ? 'win' : 'fail');
	s = checkVictory(s);
	console.log(`[QUEST] ${quest.name}: ${name} dice [${dice.join(',')}] band ${quest.band} -> ${win ? 'WIN' : 'FAIL'}`);
	return { ok: true, state: s, win, choices };
}
