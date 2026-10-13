// piecieActivationGate — rules that stop a Piecie from being activated at all (normal AND free).
// Returns an error string, or null when the Piecie may be activated. Pure.
// The Void, and Jeffrey, The Strongman (2.0): while he is on the field his owner can't activate Piecies that give MP
// (normal or free) - the list is rules/givesMpPiecies.js.
import { GIVES_MP_PIECIES } from '../../rules/givesMpPiecies.js';

export function piecieActivationGate(state, playerId, cardDef) {
	const tags = cardDef?.tags || [];
	if (state.activePlace === 'place_the_void' && tags.some(t => t === 'RESTORE' || t === 'FOOD')) {
		return 'The Void blocks RESTORE and FOOD Piecies';
	}
	const player = state.players[playerId];
	const jeffreyActive = player?.activeSlots?.some(s => s && !s.isDefeated && s.cardId === 'mosje_jeffrey');
	if (jeffreyActive && GIVES_MP_PIECIES.has(cardDef?.id)) {
		return 'Jeffrey, The Strongman: you cannot activate Piecies that give MP';
	}
	return null;
}
