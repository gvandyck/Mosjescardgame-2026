// dropTiedEffects - remove timed effects tied to something that is gone.
//   { placeId }                       -> every whilePlaceStays effect tied to that Place
//   { playerId, slotIndex?, cardId?, attachmentCardId? } -> whileAttached effects on that Mosje (each given field must match)
// Mutates the (already cloned) state and returns it.
import { DURATIONS } from './durationKinds.js';

export function dropTiedEffects(state, f = {}) {
	if (!Array.isArray(state?.timedEffects) || !state.timedEffects.length) return state;
	state.timedEffects = state.timedEffects.filter(e => {
		if (f.placeId !== undefined) return !(e.duration === DURATIONS.WHILE_PLACE_STAYS && e.tie === f.placeId);
		if (e.duration !== DURATIONS.WHILE_ATTACHED) return true;
		const hit = (f.playerId === undefined || e.target.playerId === f.playerId)
			&& (f.slotIndex === undefined || e.target.slotIndex === f.slotIndex)
			&& (f.cardId === undefined || e.target.cardId === f.cardId)
			&& (f.attachmentCardId === undefined || e.tie === f.attachmentCardId);
		return !hit;
	});
	return state;
}
