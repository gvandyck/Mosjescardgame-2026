// dropAttachments - a Mosje leaves the field: every card attached to it goes to its owner's pile.
// Mutates the (already cloned) player and slot.
import { toGraveyardEntry } from '../graveyardUtils.js';

export function dropAttachments(player, slot) {
	const list = Array.isArray(slot?.attachments) ? slot.attachments : [];
	if (list.length) {
		player.graveyard = [...(player.graveyard || []), ...list.map(a => toGraveyardEntry(a.cardId, 'discarded'))];
	}
	if (slot) slot.attachments = [];
	return player;
}
