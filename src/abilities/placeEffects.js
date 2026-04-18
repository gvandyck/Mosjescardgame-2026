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
// SKIFFA — End Phase: discard 1 card OR lose 15 MP. SUBSTANCE Mosjes immune.
// Note: Requires player choice (UI prompt) to implement discard option.
// For now, all Mosjes lose 15 MP (neutral effect).
// ─────────────────────────────────────────
export function effect_skiffa(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const hasSubstance = mosje.traits?.substance >= 1;
			if (!hasSubstance) {
				mosje.mp -= 15;
				console.log('[ABILITY] Skiffa: -15 MP (no SUBSTANCE immunity)');
			} else {
				console.log('[ABILITY] Skiffa: immune due to SUBSTANCE trait');
			}
		}
	}
	return state;
}

// ─────────────────────────────────────────
// OBBY #1 — On Quest: Physical/Resilient Quests +20 MP. Failure -10 MP.
// Note: Requires quest resolution integration to detect quest type.
// Currently implemented as passive bonus for Physical/Resilient Mosjes.
// ─────────────────────────────────────────
export function effect_obby_1(gameState, questCard, didSucceed) {
	const state = cloneState(gameState);
	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const physical = mosje.traits?.physical || 0;
	const resilient = mosje.traits?.resilient || 0;

	if (physical >= 2 || resilient >= 2) {
		if (didSucceed) {
			mosje.mp += 20;
			console.log('[ABILITY] Obby #1: +20 MP on successful Physical/Resilient quest');
		} else {
			mosje.mp -= 10;
			console.log('[ABILITY] Obby #1: -10 MP on failed Physical/Resilient quest');
		}
	}
	return state;
}

// ─────────────────────────────────────────
// ARCADE — On Quest: Technical/Creative Quests +15 MP. All dice results +1.
// Note: Dice bonus requires integration with quest resolution.
// Currently implemented as MP bonus for Technical/Creative Mosjes.
// ─────────────────────────────────────────
export function effect_arcade(gameState, questCard, didSucceed) {
	const state = cloneState(gameState);
	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const technical = mosje.traits?.technical || 0;
	const creative = mosje.traits?.creative || 0;

	if ((technical >= 2 || creative >= 2) && didSucceed) {
		mosje.mp += 15;
		console.log('[ABILITY] Arcade: +15 MP on successful Technical/Creative quest');
	}
	return state;
}

// ─────────────────────────────────────────
// ZO IS NATUUR — End Phase: all Mosjes gain 10 MP (5 at Level 0).
// Nature restores all.
// ─────────────────────────────────────────
export function effect_zo_is_natuur(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const bonus = mosje.level === 0 ? 5 : 10;
			mosje.mp += bonus;
			console.log(`[ABILITY] Zo is Natuur: +${bonus} MP (Level ${mosje.level})`);
		}
	}
	return state;
}

// ─────────────────────────────────────────
// THE VOID — End Phase: all Mosjes lose 15 MP.
// Cannot play RESTORE or FOOD Piecies (enforced via UI validation).
// ─────────────────────────────────────────
export function effect_the_void(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			mosje.mp -= 15;
			console.log('[ABILITY] The Void: -15 MP drain');
		}
	}
	// Note: RESTORE/FOOD Piecie restriction requires UI validation in card play
	return state;
}

// ─────────────────────────────────────────
// MOMENTUM FACTORY — On Piecie Activate: first Piecie each turn +10 bonus MP.
// Note: Requires tracking of Piecies played this turn.
// Currently uses pieciesPlayedThisTurn counter from gameState.
// ─────────────────────────────────────────
export function effect_momentum_factory(gameState) {
	const state = cloneState(gameState);
	// Check if this is the first Piecie played by active player this turn
	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	if (!player) return state;

	// If pieciesPlayedThisTurn is 1, this is the first Piecie
	if (player.pieciesPlayedThisTurn === 1) {
		const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
		if (slotIndex >= 0) {
			player.activeSlots[slotIndex].mp += 10;
			console.log('[ABILITY] Momentum Factory: +10 MP on first Piecie this turn');
		}
	}
	return state;
}

// ─────────────────────────────────────────
// COERT'S CARAVAN — On Draw: Coert Mosjes +15 MP. All Binti Piecies cost 5 less MP.
// Note: Binti cost reduction requires UI validation during card play.
// ─────────────────────────────────────────
export function effect_coerts_caravan(gameState) {
	const state = cloneState(gameState);
	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	if (!player) return state;

	// Bonus for Coert-tagged Mosjes when drawing
	for (const mosje of player.activeSlots) {
		if (!mosje || mosje.isDefeated) continue;
		const isCoert = mosje.mosjeId && mosje.mosjeId.toLowerCase().includes('coert');
		if (isCoert) {
			mosje.mp += 15;
			console.log('[ABILITY] Coert\'s Caravan: +15 MP for Coert Mosje on draw');
		}
	}
	// Note: Binti Piecie cost reduction requires UI validation
	return state;
}

// ─────────────────────────────────────────
// SYNERGY CHAMBER — Passive: synergy effects trigger without paired Mosje.
// Note: This requires deep integration with synergy resolver.
// For now, this is a flag that UI/synergy logic can check.
// ─────────────────────────────────────────
export function effect_synergy_chamber(gameState) {
	const state = cloneState(gameState);
	// Mark that synergy chamber is active so synergy resolver can apply effects
	state.synergyChamberActive = true;
	console.log('[ABILITY] Synergy Chamber: passive synergy triggers unlocked');
	return state;
}

// ─────────────────────────────────────────
// WELLOE GRAVEYARD — On Mosje Welloe: swap in another Mosje at +20 MP.
// Note: Requires UI prompt for player to select replacement Mosje.
// Currently implemented as a flag that UI can respond to.
// ─────────────────────────────────────────
export function effect_welloe_graveyard(gameState, welloePlayerId, newMosjeSlotIndex) {
	const state = cloneState(gameState);
	const player = state.players[welloePlayerId];
	if (!player || newMosjeSlotIndex < 0 || newMosjeSlotIndex >= player.activeSlots.length) return state;

	const newMosje = player.activeSlots[newMosjeSlotIndex];
	if (newMosje && !newMosje.isDefeated) {
		newMosje.mp += 20;
		console.log('[ABILITY] Welloe Graveyard: +20 MP to swapped-in Mosje');
	}
	return state;
}

// ─────────────────────────────────────────
// DRAIN ZONE — End Phase: lowest MP player -10 more. ATTACK Piecies +10 damage.
// ─────────────────────────────────────────
export function effect_drain_zone(gameState) {
	const state = cloneState(gameState);
	// Find player with lowest active Mosje MP
	let lowestPlayerId = null;
	let lowestMp = Infinity;

	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
		if (slotIndex >= 0) {
			const mosje = player.activeSlots[slotIndex];
			if (mosje.mp < lowestMp) {
				lowestMp = mosje.mp;
				lowestPlayerId = playerId;
			}
		}
	}

	if (lowestPlayerId) {
		const player = state.players[lowestPlayerId];
		const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
		if (slotIndex >= 0) {
			player.activeSlots[slotIndex].mp -= 10;
			console.log('[ABILITY] Drain Zone: -10 extra MP to player with lowest MP');
		}
	}
	// Note: ATTACK Piecie +10 damage bonus requires validation during card play
	return state;
}

// ─────────────────────────────────────────
// MOMENTUM STABILIZER — Passive: no Mosje loses more than 30 MP in single effect.
// Note: Requires integration into loseMP function.
// For now, this is a flag that the MP manager can check.
// ─────────────────────────────────────────
export function effect_momentum_stabilizer(gameState) {
	const state = cloneState(gameState);
	state.momentumStabilizerActive = true;
	console.log('[ABILITY] Momentum Stabilizer: 30 MP loss cap activated');
	return state;
}

// ─────────────────────────────────────────
// DELLUFT — End Phase: all players draw 1 card.
// SUBSTANCE Piecies cost 0 MP this turn.
// ─────────────────────────────────────────
export function effect_delluft(gameState) {
	const state = cloneState(gameState);
	// All players draw 1 card
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		if (player.deck.length > 0) {
			const card = player.deck.shift();
			player.hand.push(card);
			console.log(`[ABILITY] Delluft: ${playerId} drew 1 card`);
		}
	}
	// Note: SUBSTANCE Piecie cost 0 requires validation during card play
	return state;
}

// ─────────────────────────────────────────
// DIERENASIEL — Passive: all PET Piecies cost 0 MP. PET protection +25%.
// Note: Requires Piecie tag tracking and UI validation.
// Currently this is a flag that UI/card system can check.
// ─────────────────────────────────────────
export function effect_dierenasiel(gameState) {
	const state = cloneState(gameState);
	state.dienasielActive = true;
	console.log('[ABILITY] Dierenasiel: PET Piecies free and protection bonuses +25%');
	return state;
}

// ─────────────────────────────────────────
// DIGITAL GAMING STOP — On Quest: Technical Quests auto-succeed for DIGITAL.
// DIGITAL-EQUIPMENT Piecies give +20 MP.
// Note: Auto-succeed requires quest resolution integration.
// ─────────────────────────────────────────
export function effect_digital_gaming_stop(gameState, questCard, mosje) {
	const state = cloneState(gameState);
	// Check if Mosje is DIGITAL and quest is TECHNICAL
	const isDigital = mosje?.traits?.digital >= 2;
	const isPhysicalQuest = questCard?.questRequirement?.includes('physical');

	if (isDigital && !isPhysicalQuest) {
		console.log('[ABILITY] Digital Gaming Stop: DIGITAL Mosje auto-succeeds technical quest');
		// Return flag indicating auto-success
		return { ...state, questAutoSuccess: true };
	}
	// Note: DIGITAL-EQUIPMENT Piecie +20 MP bonus requires validation during card play
	return state;
}

