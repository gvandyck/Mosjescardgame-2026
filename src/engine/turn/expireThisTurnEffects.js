// expireThisTurnEffects — end of turn: every "this turn" effect on every Mosje ends.
// "This turn" keys today: powerBoostThisTurn, immuneThisTurn (Phase 58-60 add more here).
export function expireThisTurnEffects(state) {
	for (const player of Object.values(state.players || {})) {
		delete player.gamblerQuestBonusTurn; // Jeffrey, The Silent Gambler: the +15 lasts this turn only
		for (const slot of player.activeSlots || []) {
			if (!slot) continue;
			delete slot.powerBoostThisTurn;
			for (const k of ['actedThisTurn', 'attackedThisTurn', 'takenByAttacksThisTurn', 'unstoppableFired', 'flowFired']) delete slot[k];
			// Unstoppable: lasts until the end of the OWNER's next turn.
			if (slot.powerBoostUntilOwnerTurnEnd?.ownerId === state.activePlayerId) {
				delete slot.powerBoostUntilOwnerTurnEnd;
			}
			slot.immuneThisTurn = false;
		}
	}
	return state;
}
