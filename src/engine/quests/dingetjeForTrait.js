// Dingetje toch?! as a Quest trait requirement ("needs Physical 2 stars"): one failing trait condition is met by
// discarding a Dingetje (hand, or a READY placed one). Level / MP / board conditions are not trait requirements.
import { toGraveyardEntry } from '../graveyardUtils.js';
import { isReadyPiecieSlot } from './isReadyPiecieSlot.js';

const DINGETJE = 'piecie_dingetje_toch';
const TRAIT_CONDITIONS = new Set(['physical_2', 'technical_2', 'social_2']);

// The costChoice { zone, index } when it points at a usable Dingetje for this Quest, else null.
export function dingetjeForTrait(state, playerId, quest, choice) {
	if (!TRAIT_CONDITIONS.has(quest?.costId) || !choice || !Number.isInteger(choice.index)) return null;
	const p = state.players[playerId];
	if (choice.zone === 'hand') return p.hand?.[choice.index]?.cardId === DINGETJE ? { zone: 'hand', index: choice.index } : null;
	if (choice.zone === 'ready') {
		const e = p.piecieSlots?.[choice.index];
		return e?.cardId === DINGETJE && isReadyPiecieSlot(e, state.turnNumber) ? { zone: 'ready', index: choice.index } : null;
	}
	return null;
}

// Discard that Dingetje from the (cloned) state.
export function discardDingetje(state, playerId, { zone, index }) {
	const p = state.players[playerId];
	if (zone === 'hand') p.hand.splice(index, 1);
	else p.piecieSlots[index] = null;
	p.graveyard = [...(p.graveyard || []), toGraveyardEntry(DINGETJE, 'discarded')];
}
