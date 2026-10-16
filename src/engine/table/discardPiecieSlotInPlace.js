// discardPiecieSlotInPlace - like discardPiecieSlot but mutates the (already cloned) state; for use inside loss steps.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { releaseBoundPower } from './releaseBoundPower.js';

export function discardPiecieSlotInPlace(state, playerId, slotIndex) {
	const entry = state.players[playerId]?.piecieSlots?.[slotIndex];
	if (!entry) return;
	state.players[playerId].piecieSlots[slotIndex] = null;
	Object.assign(state.players, releaseBoundPower(state.players, entry));
	const p = state.players[playerId];
	if (!Array.isArray(p.graveyard)) p.graveyard = [];
	p.graveyard.push(toGraveyardEntry(entry.cardId, 'played'));
}
