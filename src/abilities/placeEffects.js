// placeEffects.js — Passive and active effect functions for each Place card.
// Filled in Phase 4.

import { PLACES } from '../data/places.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { isFresh } from '../engine/fresh/isFresh.js';
import { runMosjeTriggers } from '../engine/mosje/runMosjeTriggers.js';

console.log('[ABILITY] placeEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

// Thin wrapper over the 2.0 gain funnel (100+ levels up, Level 3 caps at 95).
function applyGain(state, mosje, amount) {
	if (!mosje || isFresh(mosje)) return;
	return applyGainToSlot(mosje, amount, { turnNumber: state.turnNumber });
}




// SKIFFA — Social Quests: all players get +2 to the dice roll. Implemented
// as an inline main.js dice-bonus term (see the questDef.category === 'Social'
// check at both quest-attempt call sites), not through this dispatcher —
// mirrors how Synergy Chamber's own dice bonus is handled.


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
			applyGain(state, player.activeSlots[slotIndex], 10);
			console.log('[ABILITY] Momentum Factory: +10 MP on first Piecie this turn');
		}
	}
	return state;
}

export function triggerPlaceDestroyedEffects(gameState, destroyingPlayerId) {
	// 2.0: Mosje placeDestroyed triggers (Alyssa Fissa Party Power) fire for the player whose card destroyed the Place.
	const next = runMosjeTriggers(cloneState(gameState), 'placeDestroyed', { destroyingPlayerId });
	return next;
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


	if (!placeDef || placeDef.trigger !== triggerPhase) return gameState;

	const state = gameState;
	let nextState = state;
	
	switch (placeId) {
		case 'place_momentum_factory':
			nextState = effect_momentum_factory(state);
			break;

		// Power-only Places (Place Power lives in getPower): nothing to resolve here.
		case 'place_boxing_ring':
		case 'place_arcade':
		case 'place_drain_zone':
		case 'place_de_box':
		// 2.0 Places resolved elsewhere (cost / loss / gain / synergy hooks): nothing to run here.
		case 'place_zo_is_natuur':
		case 'place_the_void':
		case 'place_coerts_caravan':
		case 'place_synergy_chamber':
		case 'place_welloe_graveyard':
		case 'place_momentum_stabilizer':
		case 'place_delluft':
		case 'place_dierenasiel':
			return state;

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
