// discardPiecieSlotInPlace - like discardPiecieSlot but mutates the (already cloned) state; for use inside loss steps.
import { toGraveyardEntry } from '../graveyardUtils.js';

export function discardPiecieSlotInPlace(state, playerId, slotIndex) {
	const p = state.players[playerId];
	const entry = p?.piecieSlots?.[slotIndex];
	if (!entry) return;
	p.piecieSlots[slotIndex] = null;
	if (!Array.isArray(p.graveyard)) p.graveyard = [];
	p.graveyard.push(toGraveyardEntry(entry.cardId, 'played'));
}
