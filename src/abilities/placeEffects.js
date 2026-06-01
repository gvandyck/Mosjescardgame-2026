// placeEffects.js — Passive and active effect functions for each Place card.
// Filled in Phase 4.

import { PLACES } from '../data/places.js';
import { getCardById } from '../data/cardIndex.js';

console.log('[ABILITY] placeEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function applyDamage(mosje, amount) {
	if (!mosje || mosje.isDefeated || amount <= 0) return;
	mosje.mp -= amount;
	while (mosje.mp < 0) {
		if (mosje.level === 0) { mosje.mp = 0; break; }
		const overflow = -mosje.mp;
		mosje.level -= 1;
		mosje.mp = 100 - overflow;
	}
	mosje.mp = Math.max(0, mosje.mp);
	mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + amount;
}

export function effect_the_gym(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const physical = mosje.traits?.physical || 0;
			const id = String(mosje.cardId || '').toLowerCase();
			const isCless = id.includes('cless');
			if (physical >= 3) mosje.mp += 35;
			else if (physical >= 2) mosje.mp += 25;
			else if (isCless) mosje.mp += 20;
			else applyDamage(mosje, 10);
		}
	}
	console.log('[ABILITY] The Gym end phase effect applied');
	return state;
}

export function effect_quest_haven(gameState, didSucceed, questsCompletedThisTurn = 0, targetSlotIndex = -1) {
	const state = cloneState(gameState);

	if (!didSucceed) return state;

	const playerId = state.activePlayerId;
	const player = state.players[playerId];

	// Use the slot of the Mosje that completed the quest; fall back to first active.
	const fallback = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	const slotIndex = (targetSlotIndex >= 0 && player.activeSlots[targetSlotIndex] && !player.activeSlots[targetSlotIndex].isDefeated)
		? targetSlotIndex
		: fallback;

	if (slotIndex < 0) return state;

	// +10 MP for every quest success
	player.activeSlots[slotIndex].mp += 10;
	console.log('[ABILITY] Quest Haven +10 MP → slot', slotIndex);

	// +25 MP bonus when 2 quests completed in one turn
	if (questsCompletedThisTurn >= 2) {
		player.activeSlots[slotIndex].mp += 25;
		console.log('[ABILITY] Quest Haven +25 MP bonus (2 quests this turn) → slot', slotIndex);
	}

	return state;
}

// ─────────────────────────────────────────
// BANK CHILLING — Turn Start: Social ★★+ Mosjes gain +15 MP.
// Design direction: bank chilling is a social thing.
// ─────────────────────────────────────────
export function effect_bank_chilling(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const social = mosje.traits?.social || 0;
	if (social >= 2) {
		mosje.mp += 15;
		console.log('[ABILITY] Bank Chilling: +15 MP applied (Social 2+)');
	} else {
		console.log('[ABILITY] Bank Chilling: no bonus (social below 2)');
	}

	return state;
}

// ─────────────────────────────────────────
// SKIFFA — End Phase: discard 1 card OR lose 15 MP. SUBSTANCE Mosjes immune.
// Note: Requires player choice (UI prompt) to implement discard option.
// For now, all non-SUBSTANCE Mosjes lose 15 MP.
// ─────────────────────────────────────────
export function effect_skiffa(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const hasSubstance = mosje.traits?.substance >= 1;
			if (!hasSubstance) {
				applyDamage(mosje, 15);
				console.log('[ABILITY] Skiffa: -15 MP (no SUBSTANCE immunity)');
			} else {
				console.log('[ABILITY] Skiffa: immune due to SUBSTANCE trait');
			}
		}
	}
	return state;
}

// ─────────────────────────────────────────
// OBBY #1 — On Quest: Physical ★★+/Resilient ★★+ Mosjes gain +20 MP on success, -10 MP on failure.
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
			applyDamage(mosje, 10);
			console.log('[ABILITY] Obby #1: -10 MP on failed Physical/Resilient quest');
		}
	}
	return state;
}

// ─────────────────────────────────────────
// ARCADE — On Quest: Technical ★★+ Mosjes gain +15 MP on success.
// Design direction: for Martin, Chris, Youri. Technical-focused.
// ─────────────────────────────────────────
export function effect_arcade(gameState, questCard, didSucceed) {
	const state = cloneState(gameState);
	const playerId = state.activePlayerId;
	const player = state.players[playerId];
	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const technical = mosje.traits?.technical || 0;

	if (technical >= 2 && didSucceed) {
		mosje.mp += 15;
		console.log('[ABILITY] Arcade: +15 MP on successful Technical quest');
	}
	return state;
}

// ─────────────────────────────────────────
// ZO IS NATUUR — End Phase: all Mosjes gain 10 MP.
// Resilient Mosjes gain 15 MP instead.
// ─────────────────────────────────────────
export function effect_zo_is_natuur(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const bonus = (mosje.traits?.resilient || 0) >= 1 ? 15 : 10;
			mosje.mp += bonus;
			console.log(`[ABILITY] Zo is Natuur: +${bonus} MP`);
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
			applyDamage(mosje, 15);
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
// COERT'S CARAVAN — Turn Start: Coert Mosjes gain +15 MP. All Binti Piecies cost 5 less MP.
// Design direction: exclusively for Coert. Hard requirement, good payoff.
// Binti cost reduction requires UI validation during card play.
// ─────────────────────────────────────────
export function effect_coerts_caravan(gameState) {
	const state = cloneState(gameState);
	for (const pid of Object.keys(state.players || {})) {
		const player = state.players[pid];
		if (!player) continue;

		let hasCoert = false;
		for (const mosje of player.activeSlots || []) {
			if (!mosje || mosje.isDefeated) continue;
			const id = String(mosje.cardId || mosje.mosjeId || '').toLowerCase();
			const isCoert = id.includes('coert');
			if (isCoert) {
				hasCoert = true;
				mosje.mp += 15;
				console.log('[ABILITY] Coert\'s Caravan: +15 MP for Coert Mosje');
			}
		}

		if (hasCoert) {
			player.freePiecieActivationAvailable = true;
			console.log(`[PLACE] Coert's Caravan — ${pid} gets 1 free Piecie activation this turn`);
		}
	}
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

/**
 * Returns the MP cost reduction (5) granted by Synergy Chamber for ability activations.
 * Callers: Mosje ability activation cost deduction in mosjeAbilities.js / UI layer.
 * @param {object} gameState
 * @returns {number} 5 if Synergy Chamber active, 0 otherwise
 */
export function getSynergyChambercostReduction(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 5 : 0;
}

/**
 * Returns the dice roll bonus (+1) granted by Synergy Chamber for quest rolls.
 * Already consumed in questLogic.js quest_req_perfect_timing.
 * @param {object} gameState
 * @returns {number} 1 if Synergy Chamber active, 0 otherwise
 */
export function getSynergyChamberDiceBonus(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 1 : 0;
}

/**
 * Returns the duration bonus (+1 turn) granted by Synergy Chamber to buffs applied this turn.
 * Callers: applyBuff in effects layer — add this to turnsLeft when Synergy Chamber is active.
 * @param {object} gameState
 * @returns {number} 1 if Synergy Chamber active, 0 otherwise
 */
export function getSynergyChamberDurationBonus(gameState) {
	return gameState?.activePlace === 'place_synergy_chamber' ? 1 : 0;
}

export function triggerPlaceDestroyedEffects(gameState, destroyingPlayerId) {
	const state = cloneState(gameState);
	const player = state.players?.[destroyingPlayerId];
	if (!player) return state;

	for (const slot of player.activeSlots || []) {
		if (!slot || slot.isDefeated) continue;
		if (getCardById(slot.cardId)?.id === 'mosje_alyssa_fissa') {
			slot.mp += 15;
			console.log('[ABILITY] Alyssa Fissa Fissa Party Power triggered — +15 MP');
		}
	}

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
// DRAIN ZONE — End Phase: Mosje with lowest MP (across all players) loses another 10 MP.
// ATTACK Piecies +10 damage enforced via UI validation.
// ─────────────────────────────────────────
export function effect_drain_zone(gameState) {
	const state = cloneState(gameState);
	// Find the Mosje with the lowest MP across all players
	let lowestPlayerId = null;
	let lowestSlotIndex = -1;
	let lowestMp = Infinity;

	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (let i = 0; i < player.activeSlots.length; i++) {
			const mosje = player.activeSlots[i];
			if (!mosje || mosje.isDefeated) continue;
			if (mosje.mp < lowestMp) {
				lowestMp = mosje.mp;
				lowestPlayerId = playerId;
				lowestSlotIndex = i;
			}
		}
	}

	if (lowestPlayerId !== null && lowestSlotIndex >= 0) {
		applyDamage(state.players[lowestPlayerId].activeSlots[lowestSlotIndex], 10);
		console.log('[ABILITY] Drain Zone: -10 extra MP to Mosje with lowest MP');
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
// DIGITAL-EQUIPMENT Piecies give +20 MP. Hidden/booster-only.
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

// ─────────────────────────────────────────
// BOXING RING — End Phase + On Quest
// End Phase: FIGHTING Mosjes +10 MP; non-FIGHTING -5 MP.
// On Quest: active Mosje +15 MP (GANDOE: +25 MP), any outcome.
// ─────────────────────────────────────────
export function effect_boxing_ring(gameState, questCard, didSucceed) {
	const state = cloneState(gameState);

	// ON_QUEST path: questCard is defined
	if (questCard !== undefined) {
		const playerId = state.activePlayerId;
		const player = state.players[playerId];
		if (!player) return state;
		const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
		if (slotIndex < 0) return state;
		const mosje = player.activeSlots[slotIndex];
		const id = String(mosje.cardId || mosje.mosjeId || '').toLowerCase();
		const isGandoe = id.includes('gandoe');
		const mp = isGandoe ? 25 : 15;
		mosje.mp += mp;
		console.log(`[ABILITY] Boxing Ring quest bonus: +${mp} MP${isGandoe ? ' (GANDOE)' : ''}`);
		return state;
	}

	// END_PHASE path: questCard is undefined
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			if (mosje.subtype === 'FIGHTING') {
				mosje.mp += 10;
				console.log('[ABILITY] Boxing Ring end phase: +10 MP (FIGHTING)');
			} else {
				applyDamage(mosje, 5);
				console.log('[ABILITY] Boxing Ring end phase: -5 MP (non-FIGHTING)');
			}
		}
	}
	return state;
}

// ─────────────────────────────────────────
// EENDJES VOEREN — End Phase: MICHELLE Mosje +10 MP.
// Resilience aura (always-on while active): getMosjeTrait in questLogic.js
// returns 3 for 'resilient' whenever activePlace === 'place_eendjes_voeren'.
// ─────────────────────────────────────────
export function effect_eendjes_voeren(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const id = String(mosje.cardId).toLowerCase();
			if (id.includes('michelle')) {
				mosje.mp += 10;
				console.log('[ABILITY] Eendjes Voeren: +10 MP (MICHELLE)');
			}
		}
	}
	return state;
}

// ─────────────────────────────────────────
// DE BOX — End Phase: GANDOE Mosje +20 MP; MICHELLE/TUK Mosje +15 MP.
// Both active simultaneously on same player's field: +10 bonus each.
// ─────────────────────────────────────────
export function effect_de_box(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		let gandoeSlot = null;
		let michelleSlot = null;
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const id = String(mosje.cardId).toLowerCase();
			if (id.includes('gandoe')) {
				mosje.mp += 20;
				gandoeSlot = mosje;
				console.log('[ABILITY] Toennoe: +20 MP (GANDOE)');
			} else if (id.includes('michelle')) {
				mosje.mp += 15;
				michelleSlot = mosje;
				console.log('[ABILITY] Toennoe: +15 MP (MICHELLE/TUK)');
			}
		}
		if (gandoeSlot && michelleSlot) {
			gandoeSlot.mp += 10;
			michelleSlot.mp += 10;
			console.log('[ABILITY] Toennoe: +10 bonus each (Gandoe & Michelle together)');
		}
	}
	return state;
}

// ─────────────────────────────────────────
// TESLA — Turn Start: COERT Mosje +20 MP; BINTI Mosje +20 MP.
// Both active simultaneously: +10 bonus each.
// No-op when Coert is not active (car is parked).
// Coert defeat hook: handled in victoryChecker.js markMosjeDefeated.
// ─────────────────────────────────────────
export function effect_tesla(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const coertSlot = player.activeSlots.find(
		s => s && !s.isDefeated && String(s.cardId).toLowerCase().includes('coert')
	);
	if (!coertSlot) {
		console.log('[PLACE] Tesla: Coert not active — car parked');
		return state;
	}
	let bintiActive = false;
	for (const mosje of player.activeSlots) {
		if (!mosje || mosje.isDefeated) continue;
		const id = String(mosje.cardId).toLowerCase();
		if (id.includes('coert')) mosje.mp += 20;
		if (id.includes('binti')) { mosje.mp += 20; bintiActive = true; }
	}
	if (bintiActive) {
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated) continue;
			const id = String(mosje.cardId).toLowerCase();
			if (id.includes('coert') || id.includes('binti')) mosje.mp += 10;
		}
		console.log('[PLACE] Tesla: road trip bonus — Coert & Binti together +10 each');
	}
	return state;
}

// ─────────────────────────────────────────────────────────────
// resolvePlaceEffect — central dispatcher
// Fires the effect function for the current active Place, but ONLY
// if the Place's trigger matches the given triggerPhase.
//
// triggerPhase — one of 'END_PHASE' | 'TURN_START' | 'ON_QUEST' |
//                'PASSIVE' | 'ON_PIECIE_ACTIVATE' | 'ON_WELLOE'
// context      — optional data for the effect (questCard, didSucceed, etc.)
// ─────────────────────────────────────────────────────────────
export function resolvePlaceEffect(gameState, triggerPhase, context = {}) {
	const placeId = gameState.activePlace;
	if (!placeId) return gameState;

	const placeDef = PLACES.find(p => p.id === placeId);

	// Boxing Ring fires on both ON_QUEST and END_PHASE — bypass single-trigger guard
	if (placeId === 'place_boxing_ring') {
		return effect_boxing_ring(gameState, context.questCard, context.didSucceed);
	}

	if (!placeDef || placeDef.trigger !== triggerPhase) return gameState;

	const canActivateOnTurn = Number.isFinite(gameState.activePlaceCanActivateOnTurn)
		? gameState.activePlaceCanActivateOnTurn
		: 0;
	if (gameState.turnNumber < canActivateOnTurn) return gameState;

	const state = gameState;
	let nextState = state;
	const { playerId, questCard, didSucceed, mosje, questsCompletedThisTurn, newMosjeSlotIndex } = context;

	switch (placeId) {
		case 'place_the_gym':
			nextState = effect_the_gym(state);
			break;

		case 'place_quest_haven':
			nextState = effect_quest_haven(state, didSucceed, questsCompletedThisTurn || 0, context.targetSlotIndex ?? -1);
			break;

		case 'place_bank_chilling':
			nextState = effect_bank_chilling(state, playerId);
			break;

		case 'place_skiffa':
			nextState = effect_skiffa(state);
			break;

		case 'place_obby_1':
			nextState = effect_obby_1(state, questCard, didSucceed);
			break;

		case 'place_arcade':
			nextState = effect_arcade(state, questCard, didSucceed);
			break;

		case 'place_zo_is_natuur':
			nextState = effect_zo_is_natuur(state);
			break;

		case 'place_the_void':
			nextState = effect_the_void(state);
			break;

		case 'place_momentum_factory':
			nextState = effect_momentum_factory(state);
			break;

		case 'place_coerts_caravan':
			nextState = effect_coerts_caravan(state);
			break;

		case 'place_synergy_chamber':
			nextState = effect_synergy_chamber(state);
			break;

		case 'place_welloe_graveyard':
			nextState = effect_welloe_graveyard(state, playerId, newMosjeSlotIndex ?? -1);
			break;

		case 'place_drain_zone':
			nextState = effect_drain_zone(state);
			break;

		case 'place_momentum_stabilizer':
			nextState = effect_momentum_stabilizer(state);
			break;

		case 'place_delluft':
			nextState = effect_delluft(state);
			break;

		case 'place_dierenasiel':
			nextState = effect_dierenasiel(state);
			break;

		case 'place_digital_gaming_stop':
			nextState = effect_digital_gaming_stop(state, questCard, mosje);
			break;

		case 'place_eendjes_voeren':
			nextState = effect_eendjes_voeren(state);
			break;

		case 'place_de_box':
			nextState = effect_de_box(state);
			break;

		case 'place_tesla':
			nextState = effect_tesla(state, playerId);
			break;

		default:
			console.warn('[ABILITY] resolvePlaceEffect: unknown place id', placeId);
			return state;
	}

	return {
		...nextState,
		_lastPlaceEffect: {
			placeId,
			placeName: placeDef.name,
			phase: triggerPhase,
			description: placeDef.description || 'Place effect triggered',
			time: Date.now(),
		},
	};
}
