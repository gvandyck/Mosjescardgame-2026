// expireTimedEffects - THE one place timed effects end. boundary 'turnStart' | 'turnEnd', playerId = the player whose turn
// starts / ends (state.activePlayerId at that moment). Also drops entries whose target Mosje (slot + cardId) is gone.
// Mutates the (already cloned) state and returns it.
import { DURATIONS } from './durationKinds.js';

const targetGone = (state, e) => {
	const slot = state.players?.[e.target.playerId]?.activeSlots?.[e.target.slotIndex];
	return !slot || slot.isDefeated || slot.cardId !== e.target.cardId;
};

export function expireTimedEffects(state, boundary, playerId) {
	if (!Array.isArray(state.timedEffects) || !state.timedEffects.length) return state;
	const keep = [];
	for (const e of state.timedEffects) {
		if (targetGone(state, e)) continue;
		if (boundary === 'turnStart') {
			if (e.duration === DURATIONS.OPPONENT_NEXT_TURN && !e.active && playerId !== e.ownerId) e.active = true;
		} else if (boundary === 'turnEnd') {
			if (e.duration === DURATIONS.THIS_TURN && e.endsAfterTurnOf === playerId) continue;
			if (e.duration === DURATIONS.UNTIL_END_OF_NEXT_TURN && e.ownerId === playerId) {
				if (e.skipEnds > 0) e.skipEnds -= 1;
				else continue;
			}
			if (e.duration === DURATIONS.OPPONENT_NEXT_TURN && e.active && playerId !== e.ownerId) continue;
		}
		keep.push(e);
	}
	state.timedEffects = keep;
	return state;
}
