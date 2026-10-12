// chooseQuestCostChoice — cheapest legal discard for a "First you must" Quest cost, or undefined.
import { payQuestCost } from '../../engine/quests/payQuestCost.js';
import { isReadyPiecieSlot } from '../../engine/quests/isReadyPiecieSlot.js';

const HAND_COST = { PLACE: 1, QUEST: 1, PIECIE: 2, MOSJE: 9 };

export function chooseQuestCostChoice(state, playerId, slotIndex, quest) {
	if (!quest?.costId) return { ok: true, choice: undefined };
	const player = state.players[playerId];
	const options = [{ choice: undefined, rank: 0 }];
	(player.hand || []).forEach((c, index) => options.push({ choice: { zone: 'hand', index }, rank: HAND_COST[c.type] ?? 3 }));
	(player.piecieSlots || []).forEach((e, index) => {
		if (isReadyPiecieSlot(e, state.turnNumber)) options.push({ choice: { zone: 'ready', index }, rank: 5 });
	});
	options.sort((a, b) => a.rank - b.rank);
	for (const o of options) {
		if (payQuestCost(state, playerId, slotIndex, quest, o.choice).ok) return { ok: true, choice: o.choice, rank: o.rank };
	}
	return { ok: false };
}
