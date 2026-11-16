// addMosjeToPile - a Mosje that went down lands in the player's one pile (mutates the already cloned player).
import { toGraveyardEntry } from '../graveyardUtils.js';

export function addMosjeToPile(player, slot) {
	if (!Array.isArray(player.graveyard)) player.graveyard = [];
	const entry = { ...toGraveyardEntry(slot.cardId, 'welloe'), type: 'MOSJE' };
	if (slot.name) entry.name = slot.name;
	player.graveyard.push(entry);
	return entry;
}
