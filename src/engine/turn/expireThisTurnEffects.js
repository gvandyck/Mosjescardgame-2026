// expireThisTurnEffects — end of turn: every "this turn" effect on every Mosje ends.
// NEW timed effects use the shared mechanism in src/engine/durations/ (state.timedEffects), not new fields here.
// "This turn" keys today: powerBoostThisTurn, immuneThisTurn (Phase 58-60 add more here).
export function expireThisTurnEffects(state) {
	for (const player of Object.values(state.players || {})) {
		if (player === state.players?.[state.activePlayerId]) player.questExtraDice = 0; // Controller / gear: +1 die lasts this turn
		if (player === state.players?.[state.activePlayerId]) {
			player.questEaseThisTurn = 0; // Zwoele Ming Power: an unused ease ends with the turn
				delete player.rerollGrants; // Dubbele Dosis: an unused reroll ends with the turn
			player.chainReactionFree = 0; // Chain Reaction: an unarmed / unused free activation ends with the turn
			player.chainReactionOffer = 0;
			player.mpAmplifierThisTurn = false; // MP Amplifier: an unused boost ends with the turn
			if (player.questDiceGrants) player.questDiceGrants = player.questDiceGrants.filter(g => g.lasts !== 'thisTurn'); // card die bonus (71-02); untilUsed stays
		}
		for (const slot of player.activeSlots || []) {
			if (!slot) continue;
			delete slot.powerBoostThisTurn;
			delete slot.extraAbilityUses; // Rebouleh / Double Trigger: an unused extra use ends with the turn
			delete slot.mpHemorrhageArmed; // MP Hemorrhage: an attack-less turn ends it (the card is discarded)
			delete slot.questMpOverride; // Perfect Setup: the counted MP lasts this turn only
			delete slot.momentumDiefjeThisTurn; // Momentum Diefje: the +20 on a successful attack lasts this turn only
			delete slot.hitBothOpponents; // Dikke Taks: an unused double hit ends with the turn
			for (const k of ['actedThisTurn', 'attackedThisTurn', 'takenByAttacksThisTurn', 'unstoppableFired', 'flowFired']) delete slot[k];
			slot.immuneThisTurn = false;
		}
	}
	return state;
}
