// dubbeleDingOptions - the hand Piecies Dubbele Ding may activate now: they pass the activation gate (Level, Needs,
// The Void, Jeffrey), are not locked by TemPiecie, can be paid with the Energy still left, and a free Piecie
// slot exists. Returns [{ label, cardId }] (one per card id).
import { PIECIES } from '../../data/piecies.js';
import { piecieActivationGate } from '../table/piecieActivationGate.js';
import { turnLockKey } from '../hand/turnLockKey.js';

const DEFS = Object.fromEntries(PIECIES.map(p => [p.id, p]));

export function dubbeleDingOptions(state, playerId, energyLeft, skipCardId = null) {
	const me = state.players[playerId];
	if (!(me.piecieSlots || []).some(s => s === null || s === undefined)) return [];
	const lock = turnLockKey(state);
	const seen = new Set();
	const out = [];
	let skipped = false;
	for (const c of me.hand || []) {
		const def = DEFS[c.cardId];
		if (!def || c.lockedTurn === lock) continue;
		if (c.cardId === skipCardId && !skipped) { skipped = true; continue; } // the copy already picked
		if (seen.has(c.cardId) || (Number(def.cost) || 0) > energyLeft) continue;
		if (piecieActivationGate(state, playerId, def)) continue;
		seen.add(c.cardId);
		out.push({ label: def.name, cardId: c.cardId });
	}
	return out;
}
