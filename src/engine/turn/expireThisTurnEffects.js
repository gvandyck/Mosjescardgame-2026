// expireThisTurnEffects — end of turn: every "this turn" effect on every Mosje ends.
// "This turn" keys today: powerBoostThisTurn, immuneThisTurn (Phase 58-60 add more here).
export function expireThisTurnEffects(state) {
	for (const player of Object.values(state.players || {})) {
		for (const slot of player.activeSlots || []) {
			if (!slot) continue;
			delete slot.powerBoostThisTurn;
			slot.immuneThisTurn = false;
		}
	}
	return state;
}
