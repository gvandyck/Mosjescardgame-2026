// expireThisTurnEffects — end of turn: every "this turn" effect on every Mosje ends.
// "This turn" keys today: powerBoostThisTurn, immuneThisTurn (Phase 58-60 add more here).
export function expireThisTurnEffects(state) {
	for (const player of Object.values(state.players || {})) {
		if (player === state.players?.[state.activePlayerId]) player.questExtraDice = 0; // Controller / gear: +1 die lasts this turn
		if (player === state.players?.[state.activePlayerId]) {
			delete player.rerollGrants; // Dubbele Dosis: an unused reroll ends with the turn
			player.chainReactionFree = 0; // Chain Reaction: an unarmed / unused free activation ends with the turn
			player.chainReactionOffer = 0;
		}
		delete player.gamblerQuestBonusTurn; // Jeffrey, The Silent Gambler: the +15 lasts this turn only
		for (const slot of player.activeSlots || []) {
			if (!slot) continue;
			delete slot.powerBoostThisTurn;
			delete slot.momentumDiefjeThisTurn; // Momentum Diefje: the +20 on a successful attack lasts this turn only
			delete slot.hitBothOpponents; // Dikke Taks: an unused double hit ends with the turn
			delete slot.momentumBoostWin; // Momentum Boost: the Quest-win bonus lasts this turn only
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
