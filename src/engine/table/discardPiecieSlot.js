// discardPiecieSlot — move a Piecie slot's card to its owner's discard pile. Returns new state.
import { toGraveyardEntry } from '../graveyardUtils.js';

export function discardPiecieSlot(state, playerId, slotIndex) {
	const p = state.players[playerId];
	const entry = p?.piecieSlots?.[slotIndex];
	if (!entry) return state;
	const piecieSlots = p.piecieSlots.slice();
	piecieSlots[slotIndex] = null;
	const graveyard = [...(p.graveyard || []), toGraveyardEntry(entry.cardId, 'played')];
	return { ...state, players: { ...state.players, [playerId]: { ...p, piecieSlots, graveyard } } };
}
