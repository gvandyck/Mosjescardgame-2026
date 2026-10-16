// placeEffects.js — Passive and active effect functions for each Place card.
// Filled in Phase 4.

import { PLACES } from '../data/places.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from '../engine/mp/applyMpLossToSlot.js';
import { isFresh } from '../engine/fresh/isFresh.js';
import { runMosjeTriggers } from '../engine/mosje/runMosjeTriggers.js';

console.log('[ABILITY] placeEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

// Thin wrapper over the 2.0 loss funnel. `playerId` is the OWNER of the slot being hit.
function applyDamage(state, playerId, mosje, amount) {
	if (!mosje || mosje.isDefeated || isFresh(mosje) || !(amount > 0)) return;
	// U8 - Entry Protection: effect damage fizzles against a freshly entered
	// Mosje (until its owner's next turn starts - cleared in startTurn).
	applyMpLossToSlot({ state, playerId, slot: mosje, amount, source: 'PLACE' });
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
// ZO IS NATUUR — End Phase: all Mosjes gain 10 MP.
// Resilient Mosjes gain 15 MP instead.
// ─────────────────────────────────────────
export function effect_zo_is_natuur(gameState) {
	const state = cloneState(gameState);
	for (const playerId of Object.keys(state.players)) {
		const player = state.players[playerId];
		for (const mosje of player.activeSlots) {
			if (!mosje || mosje.isDefeated || isFresh(mosje)) continue;
			const bonus = (mosje.traits?.resilient || 0) >= 1 ? 15 : 10;
			applyGain(state, mosje, bonus);
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
			if (!mosje || mosje.isDefeated || isFresh(mosje)) continue;
			applyDamage(state, playerId, mosje, 15);
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
			applyGain(state, player.activeSlots[slotIndex], 10);
			console.log('[ABILITY] Momentum Factory: +10 MP on first Piecie this turn');
		}
	}
	return state;
}

// ─────────────────────────────────────────
// COERT'S CARAVAN — Passive marker. The actual Quest-damage shield is enforced
// centrally in mpManager. Keeping this no-op lets PASSIVE dispatch stay harmless.
// ─────────────────────────────────────────
export function effect_coerts_caravan(gameState) {
	const state = cloneState(gameState);
	console.log('[ABILITY] Coert\'s Caravan: passive Quest-damage shield active');
	return state;
}

// ─────────────────────────────────────────
// SYNERGY CHAMBER — Passive: synergy effects trigger without paired Mosje.
// No effect here: holder texts read state.activePlace through isHolderTextActive
// (src/engine/synergy/isHolderTextActive.js).
// ─────────────────────────────────────────
export function effect_synergy_chamber(gameState) {
	const state = cloneState(gameState);
	console.log('[ABILITY] Synergy Chamber: passive synergy triggers unlocked');
	return state;
}

export function triggerPlaceDestroyedEffects(gameState, destroyingPlayerId) {
	// 2.0: Mosje placeDestroyed triggers (Alyssa Fissa Party Power) fire for the player whose card destroyed the Place.
	const next = runMosjeTriggers(cloneState(gameState), 'placeDestroyed', { destroyingPlayerId });
	return next;
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
		applyGain(state, newMosje, 20);
		console.log('[ABILITY] Welloe Graveyard: +20 MP to swapped-in Mosje');
	}
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


	if (!placeDef || placeDef.trigger !== triggerPhase) return gameState;

	const state = gameState;
	let nextState = state;
	const { playerId, questCard, didSucceed, mosje, questsCompletedThisTurn, newMosjeSlotIndex } = context;

	switch (placeId) {
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

		case 'place_momentum_stabilizer':
			nextState = effect_momentum_stabilizer(state);
			break;

		case 'place_delluft':
			nextState = effect_delluft(state);
			break;

		case 'place_dierenasiel':
			nextState = effect_dierenasiel(state);
			break;

		// Power-only Places (Place Power lives in getPower): nothing to resolve here.
		case 'place_boxing_ring':
		case 'place_arcade':
		case 'place_drain_zone':
		case 'place_de_box':
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
