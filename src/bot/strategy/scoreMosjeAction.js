// scoreMosjeAction - the best option for one Mosje (attack or Quest) with its expected value in the slot-worth model:
// attacks are scored by an attackMosje dry-run on the table view (real loss pipeline: pets, Stabilizer, Flow, thorns),
// Quests by chance x gain minus chance-of-failing x loss. Level 3 never risks a Quest the opponent could punish.
// Returns { kind: 'attack', targetPlayerId, targetSlotIndex, value } | { kind: 'quest', stackId, costChoice, dieChoices, value } | null.
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isValidAttackTarget } from '../../engine/actions/isValidAttackTarget.js';
import { attackMosje } from '../../engine/actions/attackMosje.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { getQuestDiceCount } from '../../engine/quests/getQuestDiceCount.js';
import { getJabTargets } from '../../engine/quests/getJabTargets.js';
import { rollQuestAttempt } from '../../engine/quests/rollQuestAttempt.js';
import { questWinChance } from './questWinChance.js';
import { chooseQuestCostChoice } from './chooseQuestCostChoice.js';
import { getBotProfile } from './botProfiles.js';
import { opponentThreat } from './opponentThreat.js';
import { slotWorth } from './slotWorth.js';
import { valueOfGain } from './valueOfGain.js';
import { valueOfLoss } from './valueOfLoss.js';
import { withQuietLog } from './withQuietLog.js';
import { asBotView } from './asBotView.js';

const JAB = 10;

// What an attack swings: every opponent slot that got worse (Dikke Taks hits two), minus what the thorns cost the attacker.
function swing(before, after, botId, targetPlayerId, slotIndex) {
	let value = 0;
	before.players[targetPlayerId].activeSlots.forEach((slot, i) => { value += slotWorth(slot) - slotWorth(after.players[targetPlayerId].activeSlots[i]); });
	return value - (slotWorth(before.players[botId].activeSlots[slotIndex]) - slotWorth(after.players[botId].activeSlots[slotIndex]));
}

function bestAttack(view, botId, slotIndex, slot) {
	if (isFresh(slot)) return null;
	let best = null;
	for (const [targetPlayerId, seat] of Object.entries(view.players)) {
		if (targetPlayerId === botId) continue;
		seat.activeSlots.forEach((_, targetSlotIndex) => {
			if (!isValidAttackTarget(view, botId, targetPlayerId, targetSlotIndex)) return;
			const params = { attackerSlotIndex: slotIndex, targetPlayerId, targetSlotIndex };
			const dry = withQuietLog(() => attackMosje(view, botId, params, { skipReactions: true }));
			if (!dry.ok) return;
			const value = swing(view, dry.state, botId, targetPlayerId, slotIndex);
			if (!best || value > best.value) best = { kind: 'attack', targetPlayerId, targetSlotIndex, value };
		});
	}
	return best;
}

function bestQuest(view, botId, slotIndex, slot) {
	const lossWeight = 1 + (0.5 - getBotProfile(view, botId).riskTolerance);
	let best = null;
	for (const stackId of Object.keys(view.questStacks || {})) {
		const quest = getQuestDef(view.questStacks[stackId]?.faceUp);
		if (!quest) continue;
		const paid = chooseQuestCostChoice(view, botId, slotIndex, quest);
		if (!paid.ok) continue;
		const dry = withQuietLog(() => rollQuestAttempt(view, botId, { slotIndex, stackId, costChoice: paid.choice, rng: () => 0, skipReactions: true }));
		if (!dry.ok) continue;
		const lose = Math.abs(quest.lose || 0);
		if (slot.level === 3 && quest.band !== 'trained' && slot.mp - lose <= opponentThreat(view, botId)) continue; // a Level 3 is not risked
		const p = questWinChance(quest.band, getQuestDiceCount(view, botId, slot, quest));
		const jab = Math.max(0, ...getJabTargets(view, botId, quest.id, { discardedCardIds: dry.pending.discardedCardIds })
			.map(t => valueOfLoss(view.players[t.playerId].activeSlots[t.slotIndex], JAB)));
		const value = p * (valueOfGain(slot, quest.win) + jab) - (1 - p) * lossWeight * valueOfLoss(slot, lose) - (paid.rank ?? 0);
		if (!best || value > best.value) best = { kind: 'quest', stackId, costChoice: paid.choice, dieChoices: {}, value };
	}
	return best;
}

export function scoreMosjeAction(state, botId, slotIndex) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	if (!canMosjeTakeAction(view, botId, slotIndex).ok) return null;
	const slot = view.players[botId].activeSlots[slotIndex];
	const attack = bestAttack(view, botId, slotIndex, slot);
	const quest = bestQuest(view, botId, slotIndex, slot);
	const best = attack && (!quest || attack.value >= quest.value) ? attack : quest; // a tie prefers the attack
	return best && best.value > 0 ? best : null;
}
