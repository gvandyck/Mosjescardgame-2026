// rollQuestAttempt — step 1 of a 2.0 Quest attempt: gate, condition, cost, dice, roll. Refusals never mutate.
import { canMosjeTakeAction } from '../actions/canMosjeTakeAction.js';
import { getQuestDef } from './getQuestDef.js';
import { checkQuestCondition } from './checkQuestCondition.js';
import { payQuestCost } from './payQuestCost.js';
import { QUEST_EXTRAS } from './questExtras.js';
import { getQuestDiceCount } from './getQuestDiceCount.js';
import { rollQuestDice } from './rollQuestDice.js';
import { isBandWin } from './isBandWin.js';

export function rollQuestAttempt(state, playerId, { slotIndex, stackId, costChoice, dieChoices = {}, rng = Math.random }) {
	const fail = (error) => ({ ok: false, state, error });
	const gate = canMosjeTakeAction(state, playerId, slotIndex);
	if (!gate.ok) return fail(gate.error);
	const questId = state.questStacks?.[stackId]?.faceUp;
	const quest = questId ? getQuestDef(questId) : null;
	if (!quest) return fail('No face-up Quest in that stack');
	const cond = checkQuestCondition(state, playerId, slotIndex, quest);
	if (!cond.ok) return fail(cond.error);
	const paid = payQuestCost(state, playerId, slotIndex, quest, costChoice);
	if (!paid.ok) return fail(paid.error);

	const s = paid.state === state ? JSON.parse(JSON.stringify(state)) : paid.state;
	const player = s.players[playerId];
	const slot = player.activeSlots[slotIndex];
	slot.actedThisTurn = true;
	player.questsAttemptedThisTurn = (player.questsAttemptedThisTurn || 0) + 1;

	const extra = QUEST_EXTRAS[quest.id]?.extraDice?.(
		{ state: s, playerId, player, slot, slotIndex, quest, revealed: paid.revealed }, dieChoices) || 0;
	const diceCount = getQuestDiceCount(s, playerId, slot, quest, { extra });
	if (s._snelleFlags?.questDiceBonus) delete s._snelleFlags.questDiceBonus;
	player.questExtraDice = 0;

	const trained = quest.band === 'trained';
	const dice = trained ? [] : rollQuestDice(diceCount, rng);
	const win = trained ? true : isBandWin(quest.band, dice);
	return {
		ok: true,
		state: s,
		pending: { playerId, slotIndex, stackId, questId, dice, diceCount: trained ? 0 : diceCount, win, revealed: paid.revealed || null, discardedCardIds: paid.discardedCardIds || [] },
	};
}
