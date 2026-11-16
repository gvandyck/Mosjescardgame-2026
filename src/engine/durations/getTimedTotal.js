// getTimedTotal - the sum of the timed effects of one kind that count right now on one Mosje. Pure read.
import { DURATIONS } from './durationKinds.js';

function counts(state, e, slot) {
	if (e.duration === DURATIONS.WHILE_ATTACHED) return (slot.attachments || []).some(a => a.cardId === e.tie);
	if (e.duration === DURATIONS.WHILE_PLACE_STAYS) return state.activePlace === e.tie;
	return e.active !== false; // this turn / until the end of your next turn / the opponent's turn once it has started
}

export function getTimedTotal(state, playerId, slotIndex, kind) {
	const list = state?.timedEffects;
	if (!Array.isArray(list) || !list.length) return 0;
	const slot = state.players?.[playerId]?.activeSlots?.[slotIndex];
	if (!slot || slot.isDefeated) return 0;
	let total = 0;
	for (const e of list) {
		if (e.kind !== kind || e.target.playerId !== playerId || e.target.slotIndex !== slotIndex || e.target.cardId !== slot.cardId) continue;
		if (counts(state, e, slot)) total += e.amount;
	}
	return total;
}
