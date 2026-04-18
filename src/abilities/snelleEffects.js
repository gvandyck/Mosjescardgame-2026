// snelleEffects.js — One function per Snelle Piecie (instant) card's effect.
// Filled in Phase 4.

console.log('[ABILITY] snelleEffects.js loaded');

export function effect_jensen(gameState) {
	console.log('[ABILITY] Jensen: cancel target piecie (resolution hook placeholder)');
	return JSON.parse(JSON.stringify(gameState));
}

export function effect_lucky_coin(gameState) {
	console.log('[ABILITY] Lucky Coin: reroll die (resolution hook placeholder)');
	return JSON.parse(JSON.stringify(gameState));
}

export function effect_emergency_healings(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
	if (slotIndex < 0) return state;

	const mosje = player.activeSlots[slotIndex];
	const resilient = mosje.traits?.resilient || 0;
	const healAmount = resilient >= 2 ? 35 : 25;
	mosje.mp += healAmount;

	console.log('[ABILITY] Emergency Healings:', `+${healAmount} MP`);
	return state;
}

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
