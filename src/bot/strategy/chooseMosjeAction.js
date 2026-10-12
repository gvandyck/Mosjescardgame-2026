// chooseMosjeAction — best expected MP swing for one Mosje: attack, Quest, or null (desk-sim style rule).
// Reads public board + own hand only. Legality is delegated to the engine (dry-run rollQuestAttempt).
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isValidAttackTarget } from '../../engine/actions/isValidAttackTarget.js';
import { getPower } from '../../engine/mp/getPower.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';
import { getJabTargets } from '../../engine/quests/getJabTargets.js';
import { rollQuestAttempt } from '../../engine/quests/rollQuestAttempt.js';
import { questWinChance } from './questWinChance.js';
import { chooseQuestCostChoice } from './chooseQuestCostChoice.js';

const GETEMT_BONUS = 20;
const JAB = 10;

function bestAttack(state, botId, slot) {
	if (isFresh(slot)) return null;
	const power = getPower(slot);
	if (power <= 0) return null;
	let best = null;
	for (const [targetPlayerId, p] of Object.entries(state.players)) {
		if (targetPlayerId === botId) continue;
		p.activeSlots.forEach((t, targetSlotIndex) => {
			if (!isValidAttackTarget(state, botId, targetPlayerId, targetSlotIndex)) return;
			const swing = Math.min(power, t.mp) + (t.mp - power <= 0 ? GETEMT_BONUS : 0);
			if (!best || swing > best.swing) best = { kind: 'attack', targetPlayerId, targetSlotIndex, swing };
		});
	}
	return best;
}

function bestQuest(state, botId, slotIndex, slot) {
	let best = null;
	for (const stackId of Object.keys(state.questStacks || {})) {
		const quest = getQuestDef(state.questStacks[stackId]?.faceUp);
		if (!quest) continue;
		const paid = chooseQuestCostChoice(state, botId, slotIndex, quest);
		if (!paid.ok) continue;
		const dry = rollQuestAttempt(state, botId, { slotIndex, stackId, costChoice: paid.choice, rng: () => 0 });
		if (!dry.ok) continue;
		const p = questWinChance(quest.band, getQuestDiceCount(state, botId, slot, quest));
		const lose = Math.abs(quest.lose || 0);
		const jab = getJabTargets(state, botId, quest.id, { discardedCardIds: dry.pending.discardedCardIds }).length ? JAB : 0;
		const killsSelf = lose > 0 && slot.mp - lose <= 0 ? GETEMT_BONUS : 0;
		const swing = p * (quest.win + jab) - (1 - p) * (lose + killsSelf) - (paid.rank ?? 0);
		if (!best || swing > best.swing) best = { kind: 'quest', stackId, costChoice: paid.choice, dieChoices: {}, swing };
	}
	return best;
}

export function chooseMosjeAction(state, botId, slotIndex) {
	if (!canMosjeTakeAction(state, botId, slotIndex).ok) return null;
	const slot = state.players[botId].activeSlots[slotIndex];
	const options = [bestAttack(state, botId, slot), bestQuest(state, botId, slotIndex, slot)].filter(Boolean);
	options.sort((a, b) => b.swing - a.swing);
	const best = options[0];
	if (!best || best.swing <= 0) return null;
	const { swing, ...action } = best;
	return action;
}
