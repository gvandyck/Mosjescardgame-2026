// discardPiecieSlot — move a Piecie slot's card to its owner's discard pile. Returns new state.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { releaseBoundPower } from './releaseBoundPower.js';

export function discardPiecieSlot(state, playerId, slotIndex) {
	const p = state.players[playerId];
	const entry = p?.piecieSlots?.[slotIndex];
	if (!entry) return state;
	const piecieSlots = p.piecieSlots.slice();
	piecieSlots[slotIndex] = null;
	const graveyard = [...(p.graveyard || []), toGraveyardEntry(entry.cardId, 'played')];
	const players = releaseBoundPower(state.players, entry);
	return { ...state, players: { ...players, [playerId]: { ...players[playerId], piecieSlots, graveyard } } };
}
