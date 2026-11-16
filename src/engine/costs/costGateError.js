// costGateError - "not playable" half of D-22, checked before Energy: a reason string when no own Mosje can pay the
// card's activationCost (an MP cost must leave the paying Mosje above 0), else null. Pure.
import { canPayCosts } from './canPayCosts.js';

export function costGateError(state, playerId, cardDef) {
	const costs = cardDef?.activationCost;
	if (!Array.isArray(costs) || costs.length === 0) return null;
	const player = state.players[playerId];
	const slots = costs.some(c => c.kind === 'mpLoss')
		? (player?.activeSlots || []).map((s, i) => (s && !s.isDefeated ? i : -1)).filter(i => i >= 0)
		: [null];
	let reason = 'No Mosje can pay the cost';
	for (const slotIndex of slots) {
		const r = canPayCosts({ state, playerId, slotIndex }, costs, {});
		if (r.ok) return null;
		reason = r.reason;
	}
	return `Cannot pay: ${reason}`;
}
