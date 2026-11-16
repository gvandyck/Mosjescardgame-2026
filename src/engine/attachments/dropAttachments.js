// dropAttachments - a Mosje leaves the field: every card attached to it goes to its owner's pile.
// Mutates the (already cloned) player and slot. With state, the "while attached" timed effects on that Mosje end too.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { dropTiedEffects } from '../durations/dropTiedEffects.js';

export function dropAttachments(player, slot, state = null) {
	const list = Array.isArray(slot?.attachments) ? slot.attachments : [];
	if (list.length) {
		player.graveyard = [...(player.graveyard || []), ...list.map(a => toGraveyardEntry(a.cardId, 'discarded'))];
	}
	if (slot) slot.attachments = [];
	if (state && list.length && player?.playerId) dropTiedEffects(state, { playerId: player.playerId, cardId: slot.cardId }); // "while attached" ends with the Mosje
	return player;
}
