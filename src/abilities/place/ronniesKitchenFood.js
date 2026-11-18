// Ronnie's Kitchen - food Piecies give 10 MP more, for both players; a fresh Mosje ignores Places.
import { isFresh } from '../../engine/fresh/isFresh.js';

export function ronniesKitchenFood({ state, targetPlayerId, slotIndex }) {
	if (state.activePlace !== 'place_ronnies_kitchen') return 0;
	const slot = state.players[targetPlayerId]?.activeSlots?.[slotIndex];
	return slot && !isFresh(slot) ? 10 : 0;
}
