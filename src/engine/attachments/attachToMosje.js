// attachToMosje - put a card onto one of the player's Mosjes. A full Mosje needs replaceIndex: that attachment goes to
// the pile first. Mutates the (already cloned) state. Returns { ok, error? }; on a refusal nothing has changed.
import { getMaxAttachments } from './getMaxAttachments.js';
import { toGraveyardEntry } from '../graveyardUtils.js';
import { dropTiedEffects } from '../durations/dropTiedEffects.js';

export function attachToMosje(state, playerId, mosjeSlotIndex, cardId, { replaceIndex } = {}) {
	const player = state.players?.[playerId];
	const slot = player?.activeSlots?.[mosjeSlotIndex];
	if (!slot || slot.isDefeated || !cardId) return { ok: false, error: 'No Mosje to attach to' };
	const list = Array.isArray(slot.attachments) ? slot.attachments : [];
	if (list.length >= getMaxAttachments(slot)) {
		if (!Number.isInteger(replaceIndex) || replaceIndex < 0 || replaceIndex >= list.length) {
			return { ok: false, error: 'This Mosje is full: pick a card to replace' };
		}
		const [gone] = list.splice(replaceIndex, 1);
		player.graveyard = [...(player.graveyard || []), toGraveyardEntry(gone.cardId, 'discarded')];
		dropTiedEffects(state, { playerId, slotIndex: mosjeSlotIndex, attachmentCardId: gone.cardId }); // "while attached" ends
	}
	slot.attachments = [...list, { cardId, attachedTurn: state.turnNumber }];
	return { ok: true };
}
