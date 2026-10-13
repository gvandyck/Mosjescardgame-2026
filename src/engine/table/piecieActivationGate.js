// piecieActivationGate — rules that stop a Piecie from being activated at all (normal AND free).
// Returns an error string, or null when the Piecie may be activated. Pure.
// Phase 58-02: The Void and Jeffrey's V4 tag block. Jeffrey's 2.0 "no MP-giving Piecies" replaces his block
// here (Phase 58, Jeffrey plan) so both activation paths pick it up.
export function piecieActivationGate(state, playerId, cardDef) {
	const tags = cardDef?.tags || [];
	if (state.activePlace === 'place_the_void' && tags.some(t => t === 'RESTORE' || t === 'FOOD')) {
		return 'The Void blocks RESTORE and FOOD Piecies';
	}
	const player = state.players[playerId];
	const jeffreyActive = player?.activeSlots?.some(s => s && !s.isDefeated && s.cardId === 'mosje_jeffrey');
	if (jeffreyActive && tags.some(t => t === 'FOOD' || t === 'RESTORE')) {
		return 'Jeffrey The Strongman cannot use FOOD or RESTORE Piecies';
	}
	return null;
}
