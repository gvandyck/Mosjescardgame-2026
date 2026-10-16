// heldPiecieDef - the Piecie definition the held action of an open reaction window activates (null for anything else).
import { PIECIES } from '../data/piecies.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));

export function heldPiecieDef(state, action) {
	const a = action?.args || [];
	if (action?.type === 'activatePiecie') return DEFS[state.players[a[0]]?.piecieSlots?.[a[1]]?.cardId] || null;
	if (action?.type === 'resumePiecie') return DEFS[a[0]?.piecie?.cardDef?.id] || null;
	if (action?.type === 'activatePiecieFree') {
		const src = a[1] || {};
		if (Number.isInteger(src.slotIndex)) return DEFS[state.players[a[0]]?.piecieSlots?.[src.slotIndex]?.cardId] || null;
		return DEFS[src.card?.cardId ?? src.card] || null;
	}
	return null;
}
