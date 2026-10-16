// snelleEffects.js — One function per Snelle Piecie (instant) card's effect.
// Filled in Phase 4.

import { loseMP } from '../engine/mpManager.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';

console.log('[ABILITY] snelleEffects.js loaded');

// Rewritten Snelle live in section files under ./snelle/ (Phase 60); V4 bodies of the others stay here until their plan.
export * from './snelle/snelleMpEffects.js';
export * from './snelle/snelleProtectEffects.js';
export * from './snelle/snelleDiceEffects.js';
export * from './snelle/snelleCancelEffects.js';
export * from './snelle/snelleCopyEffects.js';

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
