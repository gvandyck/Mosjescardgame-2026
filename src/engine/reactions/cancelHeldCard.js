// cancelHeldCard - a cancelled Piecie / Snelle never resolves: it leaves its slot (or its hand / deck source) for its
// owner's discard pile ('discard') or the bottom of their deck ('deckBottom'). Its Energy stays spent. Returns a new state.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { discardPiecieSlot } from '../table/discardPiecieSlot.js';

export function cancelHeldCard(state, playerId, slotIndex, dest, cardDef) {
	const entry = slotIndex >= 0 ? state.players[playerId]?.piecieSlots?.[slotIndex] : null;
	if (dest !== 'deckBottom') {
		if (entry) return discardPiecieSlot(state, playerId, slotIndex);
		const next = JSON.parse(JSON.stringify(state));
		(next.players[playerId].graveyard ||= []).push(toGraveyardEntry(cardDef.id, 'played'));
		return next;
	}
	const next = JSON.parse(JSON.stringify(state));
	const me = next.players[playerId];
	if (entry) me.piecieSlots[slotIndex] = null;
	me.deck.push({ cardId: cardDef.id, type: cardDef.type || 'PIECIE', faceDown: false });
	return next;
}
