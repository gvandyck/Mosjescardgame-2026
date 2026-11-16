// getReadyPiecies - the ONE answer to "ready Piecies of tag X / named Y" (D-19): face-down ready cards in Piecie slots
// plus every attached card (attached gear always counts). Entries: { zone: 'slot', slotIndex, cardId } |
// { zone: 'attached', mosjeSlotIndex, attachIndex, cardId }. Filter: { tag } or { name: cardId }.
import { isPiecieReady } from '../table/isPiecieReady.js';
import { PIECIES } from '../../data/piecies.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));

function matches(cardId, { tag, name }) {
	if (name !== undefined && cardId !== name) return false;
	if (tag !== undefined && DEFS[cardId]?.tag !== tag) return false;
	return true;
}

export function getReadyPiecies(state, playerId, filter = {}) {
	const player = state.players?.[playerId];
	const out = [];
	(player?.piecieSlots || []).forEach((slot, slotIndex) => {
		if (isPiecieReady(slot, state.turnNumber) && matches(slot.cardId, filter)) out.push({ zone: 'slot', slotIndex, cardId: slot.cardId });
	});
	(player?.activeSlots || []).forEach((mosje, mosjeSlotIndex) => {
		if (!mosje || mosje.isDefeated) return;
		(mosje.attachments || []).forEach((a, attachIndex) => {
			if (matches(a.cardId, filter)) out.push({ zone: 'attached', mosjeSlotIndex, attachIndex, cardId: a.cardId });
		});
	});
	return out;
}
