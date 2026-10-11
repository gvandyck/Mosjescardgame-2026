import { MOSJES } from '../../data/mosjes.js';

// First non-defeated slot index whose Mosje carries `tag` (-1 if none).
export function findTagSlot(player, tag) {
	const wantedTag = String(tag).toUpperCase();
	return (player?.activeSlots || []).findIndex(slot => {
		if (!slot || slot.isDefeated) return false;
		const def = MOSJES.find(m => m.id === slot.cardId);
		const tags = [...(Array.isArray(slot.tags) ? slot.tags : []), ...(Array.isArray(def?.tags) ? def.tags : [])];
		return tags.some(v => String(v).toUpperCase() === wantedTag);
	});
}
