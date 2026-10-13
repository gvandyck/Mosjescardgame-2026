// runQuestFlow — human Quest: pick Mosje, pick one of the 3 face-up Quests (unmeetable ones disabled with the reason),
// pay/choose, roll (rollQuestAttempt), show the dice, then resolve (resolveQuestAttempt) with the post-roll picks.
import { rollQuestAttempt } from '../../engine/quests/rollQuestAttempt.js';
import { resolveQuestAttempt } from '../../engine/quests/resolveQuestAttempt.js';
import { checkQuestCondition } from '../../engine/quests/checkQuestCondition.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { QUEST_STACK_IDS } from '../../engine/setup/setupRules.js';
import { pickActingMosje } from './pickActingMosje.js';
import { pickQuestChoices } from './pickQuestChoices.js';
import { legalCostChoices } from './legalCostChoices.js';
import { escapeMeta } from './escapeMeta.js';
import { offerWestPeek } from './offerWestPeek.js';

export async function runQuestFlow({ state: startState, playerId, modal, rng = Math.random, settle = async s => s }) {
	let state = startState;
	let none = { state, log: [] };
	const slotIndex = await pickActingMosje({ state, playerId, modal, purpose: 'quest' });
	if (slotIndex == null) return none;
	// Senor West (holder text): an optional look at a Quest stack; the once-per-turn flag stays even if the attempt is cancelled.
	state = await offerWestPeek({ state, playerId, modal });
	none = { state, log: [] };

	const options = [];
	for (const stackId of QUEST_STACK_IDS) {
		const quest = getQuestDef(state.questStacks?.[stackId]?.faceUp);
		if (!quest) continue;
		const cond = checkQuestCondition(state, playerId, slotIndex, quest);
		let reason = cond.ok ? '' : cond.error;
		if (cond.ok && legalCostChoices(state, playerId, slotIndex, stackId).length === 0) reason = `Cannot pay: ${quest.costText}`;
		options.push({ id: stackId, label: quest.name, metaLabel: escapeMeta(reason || `${quest.band} +${quest.win}/-${Math.abs(quest.lose ?? 0)}`), disabled: !!reason });
	}
	if (!options.some(o => !o.disabled)) {
		await modal.showOptionSelect({ title: 'No Quest available', prompt: 'None of the face-up Quests can be attempted by this Mosje.', options: [{ id: 'ok', label: 'OK' }] });
		return none;
	}
	const stackId = await modal.showOptionSelect({ title: 'Attempt which Quest?', options, allowCancel: true });
	if (stackId == null) return none;

	const pre = await pickQuestChoices({ state, playerId, modal, phase: 'pre', slotIndex, stackId });
	if (!pre) return none;
	const roll = rollQuestAttempt(state, playerId, { slotIndex, stackId, costChoice: pre.costChoice, dieChoices: pre.dieChoices, rng });
	if (!roll.ok) {
		await modal.showOptionSelect({ title: 'Cannot attempt', prompt: roll.error, options: [{ id: 'ok', label: 'OK' }] });
		return none;
	}
	let rolled = roll.state;
	let pending = roll.pending;
	if (roll.reactionPending) {
		// Reaction windows (before/after the roll) settle first; the finished roll is then held in state.pendingQuestRoll.
		rolled = await settle(roll.state);
		pending = rolled.pendingQuestRoll;
		if (!pending) return { state: rolled, log: [] };
	}
	const quest = getQuestDef(pending.questId);
	const mosje = state.players[playerId].activeSlots[slotIndex].name;
	await modal.showOptionSelect({
		title: pending.win ? 'Quest succeeded' : 'Quest failed',
		prompt: `${quest.name} (${quest.band}): ${pending.diceCount ? `dice ${pending.dice.join(', ')}` : 'no roll'}`,
		options: [{ id: 'ok', label: 'Continue' }],
	});
	// The cost (and acted flag) are already spent in roll.state: cancelling later is not an undo.
	const choices = await pickQuestChoices({ state: rolled, playerId, modal, phase: 'post', pending }) || {};
	const done = resolveQuestAttempt(rolled, pending, choices);
	if (!done.ok) {
		await modal.showOptionSelect({ title: 'Quest cannot resolve', prompt: done.error, options: [{ id: 'ok', label: 'OK' }] });
		return { state: rolled, log: [`${mosje} attempted ${quest.name}`] };
	}
	return { state: done.state, log: [`${mosje} ${pending.win ? 'won' : 'failed'} ${quest.name} (dice ${pending.dice.join(', ') || '-'})`] };
}
