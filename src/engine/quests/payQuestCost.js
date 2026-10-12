// payQuestCost — pay a "First you must" cost on a clone. Never refunded afterwards.
import { QUEST_COSTS } from './questCosts.js';

export function payQuestCost(state, playerId, slotIndex, quest, costChoice) {
	const cost = quest?.costId ? QUEST_COSTS[quest.costId] : null;
	if (!cost) return { ok: true, state };
	const s = JSON.parse(JSON.stringify(state));
	const ctx = { state: s, playerId, player: s.players[playerId], slot: s.players[playerId].activeSlots[slotIndex], quest };
	if (!cost.canPay(ctx, costChoice)) return { ok: false, state, error: `Cannot pay: ${quest.costText || quest.costId}` };
	cost.pay(ctx, costChoice);
	return { ok: true, state: s, revealed: ctx.revealed, discardedCardIds: ctx.discarded || [] };
}
