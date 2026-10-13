// readyPiecieSlots — the placed Piecies a player could activate right now (ready, not blocked by a gate).
// Used by the free-activation chain Mosjes (Jisca, DDR Chris). Returns [{ label, slotIndex }].
import { isPiecieReady } from './isPiecieReady.js';
import { piecieActivationGate } from './piecieActivationGate.js';
import { PIECIES } from '../../data/piecies.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));

export function readyPiecieSlots(state, playerId) {
	const slots = state.players[playerId]?.piecieSlots || [];
	const out = [];
	slots.forEach((slot, slotIndex) => {
		const def = slot && DEFS[slot.cardId];
		if (!def || !isPiecieReady(slot, state.turnNumber)) return;
		if (piecieActivationGate(state, playerId, def)) return;
		out.push({ label: def.name, slotIndex });
	});
	return out;
}
