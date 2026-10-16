// rollQuestAttempt — step 1 of a 2.0 Quest attempt: gate, condition, cost, dice, roll. Refusals never mutate.
import { canMosjeTakeAction } from '../actions/canMosjeTakeAction.js';
import { getQuestDef } from './getQuestDef.js';
import { discardDingetje } from './dingetjeForTrait.js';
import { checkQuestCondition } from './checkQuestCondition.js';
import { payQuestCost } from './payQuestCost.js';
import { QUEST_EXTRAS } from './questExtras.js';
import { getQuestDiceCount } from './getQuestDiceCount.js';
import { queuedRng } from '../dice/queuedRng.js';
import { rollQuestDice } from './rollQuestDice.js';
import { isBandWin } from './isBandWin.js';
import { getEligibleReactions } from '../reactions/getEligibleReactions.js';
import { buildPendingReaction } from '../reactions/buildPendingReaction.js';
import { REACTION_MOMENTS as M } from '../reactions/reactionMoments.js';

export function rollQuestAttempt(state, playerId, options) {
	if (options.skipReactions || state.pendingReaction) return rollCore(state, playerId, options);
	const other = Object.keys(state.players).find(id => id !== playerId);
	if (!options.skipBeforeRoll) {
		const dry = rollCore(state, playerId, { ...options, rng: () => 0.5 });
		const eligible = dry.ok ? getEligibleReactions(state, playerId, [M.BEFORE_OWN_QUEST_ROLL]) : [];
		if (eligible.length) {
			const { rng, ...args } = options;
			const w = { responderId: playerId, moments: [M.BEFORE_OWN_QUEST_ROLL], eligible };
			return { ok: true, state: buildPendingReaction(state, playerId, { type: 'quest', args: [playerId, args] }, [w]), reactionPending: true };
		}
	}
	const res = rollCore(state, playerId, options);
	if (!res.ok) return res;
	const windows = [];
	for (const [who, moments] of [[other, [M.AFTER_QUEST_ROLL]], [playerId, [M.AFTER_OWN_QUEST_ROLL]]]) {
		const eligible = who ? getEligibleReactions(res.state, who, moments, { dice: res.pending.dice }) : [];
		if (eligible.length) windows.push({ responderId: who, moments, eligible });
	}
	if (!windows.length) return res;
	const held = JSON.parse(JSON.stringify(res.state));
	held.pendingQuestRoll = res.pending;
	return { ...res, state: buildPendingReaction(held, playerId, { type: 'continueQuest', args: [] }, windows), reactionPending: true };
}

function rollCore(state, playerId, { slotIndex, stackId, costChoice, dieChoices = {}, rng = queuedRng }) {
	const fail = (error) => ({ ok: false, state, error });
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) return fail(gate.error);
	const questId = state.questStacks?.[stackId]?.faceUp;
	const quest = questId ? getQuestDef(questId) : null;
	if (!quest) return fail('No face-up Quest in that stack');
	const cond = checkQuestCondition(state, playerId, slotIndex, quest, costChoice);
	if (!cond.ok) return fail(cond.error);
	const paid = payQuestCost(state, playerId, slotIndex, quest, costChoice);
	if (!paid.ok) return fail(paid.error);

	const s = paid.state === state ? JSON.parse(JSON.stringify(state)) : paid.state;
	const player = s.players[playerId];
	if (cond.dingetje) discardDingetje(s, playerId, cond.dingetje);
	const slot = player.activeSlots[slotIndex];
	slot.actedThisTurn = true;
	player.questsAttemptedThisTurn = (player.questsAttemptedThisTurn || 0) + 1;

	const extra = QUEST_EXTRAS[quest.id]?.extraDice?.(
		{ state: s, playerId, player, slot, slotIndex, quest, revealed: paid.revealed }, dieChoices) || 0;
	const diceCount = getQuestDiceCount(s, playerId, slot, quest, { extra });
	player.questExtraDice = 0;
	for (const g of player.rerollGrants || []) if (g.scope === 'ownQuest') g.forRoll = true; // Dubbele Dosis: reroll belongs to this Quest

	const trained = quest.band === 'trained';
	const dice = trained ? [] : rollQuestDice(diceCount, rng);
	const win = trained ? true : isBandWin(quest.band, dice);
	return {
		ok: true,
		state: s,
		pending: { playerId, slotIndex, stackId, questId, dice, diceCount: trained ? 0 : diceCount, win, revealed: paid.revealed || null, discardedCardIds: paid.discardedCardIds || [] },
	};
}
