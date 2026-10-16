// otherHitTarget - Dikke Taks: the other opponent Mosje that is also hit (alive, not fresh, not the main target), or -1.
import { isFresh } from '../fresh/isFresh.js';

export function otherHitTarget(state, targetPlayerId, targetSlotIndex) {
	const slots = state.players[targetPlayerId]?.activeSlots || [];
	return slots.findIndex((s, i) => i !== targetSlotIndex && s && !s.isDefeated && !isFresh(s));
}
