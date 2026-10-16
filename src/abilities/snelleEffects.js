// snelleEffects.js — One function per Snelle Piecie (instant) card's effect.
// Filled in Phase 4.

import { loseMP } from '../engine/mpManager.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';

console.log('[ABILITY] snelleEffects.js loaded');

// Rewritten Snelle live in section files under ./snelle/ (Phase 60); V4 bodies of the others stay here until their plan.
export * from './snelle/snelleMpEffects.js';
export * from './snelle/snelleProtectEffects.js';
export * from './snelle/snelleDiceEffects.js';

export function effect_emergency_healings(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const resilient = mosje.traits?.resilient || 0;
	const healAmount = resilient >= 2 ? 35 : 25;
	applyGainToSlot(mosje, healAmount, { turnNumber: state.turnNumber });

	console.log('[ABILITY] Emergency Healings:', `+${healAmount} MP`);
	return state;
}

// New starter-compatible aliases (data now uses these ids)
// V4 body, kept because a legacy test still imports it (the live Ff Haaltje Nemen is effect_snelle_ff_haaltje_nemen).
export function effect_ff_haaltje_nemen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const resilient = mosje.traits?.resilient || 0;
	const reduction = resilient >= 2 ? 30 : 20;
	mosje.statusEffects.push({
		type: 'MP_LOSS_REDUCTION',
		value: reduction,
		turnsLeft: 1,
	});

	console.log('[ABILITY] FF Haaltje Nemen: incoming MP loss reduction set to', reduction);
	return state;
}

export function effect_snelle_jensen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const selected = state._pendingTargets?.jensen_slot_index;
	const slotIndex = Number.isInteger(selected)
		? selected
		: player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0 && player.activeSlots[slotIndex] && !player.activeSlots[slotIndex].isDefeated) {
		applyGainToSlot(player.activeSlots[slotIndex], 20, { turnNumber: state.turnNumber });
	}
	if (state._pendingTargets) delete state._pendingTargets.jensen_slot_index;
	console.log('[ABILITY] Jensen: +20 MP');
	return state;
}

// ─────────────────────────────────────────
// STUBS — implement in future phases
// ─────────────────────────────────────────

// Counter Strikka — negate the next opponent Piecie played this turn
export function effect_snelle_counter_strikka(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.negateNextPiecie = state._snelleFlags.negateNextPiecie || {};
	state._snelleFlags.negateNextPiecie[playerId] = true;
	console.log('[ABILITY] Counter Strikka: next opponent Piecie will be negated');
	return state;
}

// Jammertje Gepakt — negate next opponent search/draw action + reveal 1 random hand card
export function effect_snelle_jammertje_gepakt(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.negateNextSearch = state._snelleFlags.negateNextSearch || {};
	state._snelleFlags.negateNextSearch[playerId] = true;
	console.log('[ABILITY] Jammertje Gepakt: next opponent search/draw action will be negated');
	return state;
}

// Dubbele Temminks — trigger the last played Piecie effect a second time
export function effect_snelle_dubbele_temminks(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.doubleNextPiecie = state._snelleFlags.doubleNextPiecie || {};
	state._snelleFlags.doubleNextPiecie[playerId] = true;
	console.log('[ABILITY] Dubbele Temminks: next Piecie effect will trigger twice');
	return state;
}

// Gevalletje Klakkeloos — copy the opponent's last Piecie effect, apply to yourself
export function effect_snelle_gevalletje_klakkeloos(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const lastEffect = state._lastPiecieEffect;
	if (!lastEffect?.effectId || !lastEffect?.byPlayer || lastEffect.byPlayer === playerId) {
		console.log('[ABILITY] Gevalletje Klakkeloos: no valid opponent Piecie to copy');
		return state;
	}
	// Flag for resolution — consumed by playSnellie hook in turnManager
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.copyLastPiecie = { forPlayer: playerId, effectId: lastEffect.effectId };
	console.log('[ABILITY] Gevalletje Klakkeloos: copying', lastEffect.effectId);
	return state;
}

// Frenssen — counter-chain: negate the last played Snelle Piecie, can itself be countered
export function effect_snelle_frenssen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.counterChain = state._snelleFlags.counterChain || [];
	state._snelleFlags.counterChain.push({ playerId, card: 'frenssen' });
	console.log('[ABILITY] Frenssen: counter-chain stack entry added');
	return state;
}

// Blensen — ultimate counter: negates any Snelle Piecie; free if countering a Frenssen
export function effect_snelle_blensen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.counterChain = state._snelleFlags.counterChain || [];

	// Free-cost branch: Blensen is free when countering a Frenssen (last chain entry)
	const chain = state._snelleFlags.counterChain;
	if (chain.length > 0 && chain[chain.length - 1].card === 'frenssen') {
		state._snelleFlags.blensenIsFreeThisActivation = true;
		console.log('[ABILITY] Blensen: countering Frenssen — activation is FREE this time');
	}

	chain.push({ playerId, card: 'blensen' });
	console.log('[ABILITY] Blensen: ultimate counter-chain stack entry added');
	return state;
}

