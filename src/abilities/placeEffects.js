// placeEffects.js — Passive and active effect functions for each Place card.
// Filled in Phase 4.

console.log('[ABILITY] placeEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

export function effect_the_gym(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const physical = mosje.traits?.physical || 0;
			if (physical >= 3) mosje.mp += 35;
			else if (physical >= 2) mosje.mp += 25;
			else mosje.mp -= 10;
		}
	}
	console.log('[ABILITY] The Gym end phase effect applied');
	return state;
}

export function effect_quest_haven(gameState, didCompleteTwoQuestsThisTurn = false) {
	const state = cloneState(gameState);
	if (!didCompleteTwoQuestsThisTurn) {
		console.log('[ABILITY] Quest Haven active: +10 MP reward modifier is handled in quest resolution');
		return state;
	}

	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex >= 0) player.activeSlots[slotIndex].mp += 25;

	console.log('[ABILITY] Quest Haven bonus applied: +25 MP for 2 quests in one turn');
	return state;
}

export function effect_bank_chilling(gameState, playerId, cardsDrawnInAction) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	if (cardsDrawnInAction < 2) {
		console.log('[ABILITY] Bank Chilling: no bonus (drew fewer than 2 cards)');
		return state;
	}

	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const mental = mosje.traits?.mental || 0;
	if (mental >= 2) {
		mosje.mp += 15;
		console.log('[ABILITY] Bank Chilling: +15 MP applied');
	} else {
		console.log('[ABILITY] Bank Chilling: no bonus (mental below 2)');
	}

	return state;
}

// ─────────────────────────────────────────
// STUBS — implement in future phases
// ─────────────────────────────────────────

export function effect_skiffa(gameState) { console.log('[STUB] skiffa'); return gameState; }
export function effect_obby_1(gameState) { console.log('[STUB] obby_1'); return gameState; }
export function effect_arcade(gameState) { console.log('[STUB] arcade'); return gameState; }
export function effect_zo_is_natuur(gameState) { console.log('[STUB] zo_is_natuur'); return gameState; }
export function effect_the_void(gameState) { console.log('[STUB] the_void'); return gameState; }
export function effect_momentum_factory(gameState) { console.log('[STUB] momentum_factory'); return gameState; }
export function effect_coerts_caravan(gameState) { console.log('[STUB] coerts_caravan'); return gameState; }
export function effect_synergy_chamber(gameState) { console.log('[STUB] synergy_chamber'); return gameState; }
export function effect_welloe_graveyard(gameState) { console.log('[STUB] welloe_graveyard'); return gameState; }
export function effect_drain_zone(gameState) { console.log('[STUB] drain_zone'); return gameState; }
export function effect_momentum_stabilizer(gameState) { console.log('[STUB] momentum_stabilizer'); return gameState; }
export function effect_delluft(gameState) { console.log('[STUB] delluft'); return gameState; }
export function effect_dierenasiel(gameState) { console.log('[STUB] dierenasiel'); return gameState; }
export function effect_digital_gaming_stop(gameState) { console.log('[STUB] digital_gaming_stop'); return gameState; }

