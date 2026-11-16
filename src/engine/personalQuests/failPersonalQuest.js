// failPersonalQuest - a failed Personal Quest (D-05): the Piecies named under Needs are discarded (from their slot or
// from the Mosje they are attached to; any already gone are skipped), Places and Mosjes stay, the card goes back into
// the deck and the deck is reshuffled. Pay was paid up front and is never given back. Mutates the cloned state.
import { shuffleDeck } from '../deckEngine.js';
import { toGraveyardEntry } from '../graveyardUtils.js';

export function failPersonalQuest(state, pending) {
	const player = state.players[pending.playerId];
	const gone = [];
	for (const e of (pending.needPicks || []).filter(e => e.zone === 'slot')) {
		if (player.piecieSlots?.[e.slotIndex]?.cardId !== e.cardId) continue;
		player.piecieSlots[e.slotIndex] = null;
		gone.push(e.cardId);
	}
	const attached = (pending.needPicks || []).filter(e => e.zone === 'attached').sort((a, b) => b.attachIndex - a.attachIndex);
	for (const e of attached) {
		const list = player.activeSlots?.[e.mosjeSlotIndex]?.attachments;
		if (list?.[e.attachIndex]?.cardId !== e.cardId) continue;
		list.splice(e.attachIndex, 1);
		gone.push(e.cardId);
	}
	player.graveyard = [...(player.graveyard || []), ...gone.map(id => toGraveyardEntry(id, 'discarded'))];
	player.deck = shuffleDeck([...(player.deck || []), { cardId: pending.cardId, type: 'PERSONAL_QUEST' }]);
	return state;
}
