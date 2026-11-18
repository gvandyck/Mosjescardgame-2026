// friendSlotsOnField - slot indexes (in slot order) of the player's live Mosjes that are one of the named friends.
import { isFriend } from './isFriend.js';

export function friendSlotsOnField(state, playerId, names) {
	const out = [];
	(state.players[playerId]?.activeSlots || []).forEach((slot, i) => {
		if (slot && !slot.isDefeated && isFriend(slot, names)) out.push(i);
	});
	return out;
}
