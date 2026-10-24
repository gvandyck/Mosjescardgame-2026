// getQuestTargets.js — which of the 3 face-up Quests this Mosje can attempt (63-UI-SPEC "Targeting", D-05, D-06).
// Returns one entry per stack: { stackId, valid, short, reason }. short is the badge word ('Acted', 'Locked', "Can't pay"),
// reason the full sentence for the toast; the reason strings come from the engine / the Quest flow. The engine re-checks.
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { checkQuestCondition } from '../../engine/quests/checkQuestCondition.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { QUEST_STACK_IDS } from '../../engine/setup/setupRules.js';
import { legalCostChoices } from '../actions/legalCostChoices.js';

function judge(state, playerId, slotIndex, stackId) {
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) {
		const acted = state.players[playerId]?.activeSlots?.[slotIndex]?.actedThisTurn;
		return { short: acted ? 'Acted' : '', reason: gate.error };
	}
	const quest = getQuestDef(state.questStacks?.[stackId]?.faceUp);
	if (!quest) return { short: '', reason: 'No Quest in this stack' };
	const cond = checkQuestCondition(state, playerId, slotIndex, quest);
	if (!cond.ok) return { short: 'Locked', reason: cond.error };
	if (legalCostChoices(state, playerId, slotIndex, stackId).length === 0) return { short: "Can't pay", reason: `Cannot pay: ${quest.costText}` };
	return null;
}

export function getQuestTargets(state, playerId, slotIndex) {
	return QUEST_STACK_IDS.map((stackId) => {
		const bad = judge(state, playerId, slotIndex, stackId);
		return bad ? { stackId, valid: false, ...bad } : { stackId, valid: true, short: '', reason: '' };
	});
}
