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

// New starter-compatible aliases (data now uses these ids)
export function effect_snelle_jensen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0) player.activeSlots[slotIndex].mp += 20;
	console.log('[ABILITY] Jensen: +20 MP');
	return state;
}

export function effect_snelle_emergency_healings(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0) {
		const mosje = player.activeSlots[slotIndex];
		if (mosje.mp <= 0) mosje.mp = 30;
	}
	console.log('[ABILITY] Emergency Healings (snelle)');
	return state;
}

export function effect_snelle_lucky_coin(gameState) {
	console.log('[STUB] snelle_lucky_coin');
	return gameState;
}

export function effect_snelle_ff_haaltje_nemen(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const { drawCards } = { drawCards: (deck, n) => ({ drawn: deck.splice(0, n), remaining: deck }) };
	const drawn = player.deck.splice(0, 2);
	player.hand.push(...drawn);
	console.log('[ABILITY] Ff Haaltje Nemen: draw 2');
	return state;
}

// ─────────────────────────────────────────
// STUBS — implement in future phases
// ─────────────────────────────────────────

export function effect_snelle_counter_strikka(gameState) { console.log('[STUB] counter_strikka'); return gameState; }
export function effect_snelle_perfect_dodge(gameState) { console.log('[STUB] perfect_dodge'); return gameState; }
export function effect_snelle_jammertje_gepakt(gameState) { console.log('[STUB] jammertje_gepakt'); return gameState; }
export function effect_snelle_momentum_rush(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0) player.activeSlots[slotIndex].mp += 15;
	console.log('[ABILITY] Momentum Rush: +15 MP');
	return state;
}
export function effect_snelle_negate_elimination(gameState) { console.log('[STUB] negate_elimination'); return gameState; }
export function effect_snelle_drain_reversal(gameState) { console.log('[STUB] drain_reversal'); return gameState; }
export function effect_snelle_the_protector(gameState) { console.log('[STUB] the_protector'); return gameState; }
export function effect_snelle_jeweetniet(gameState) { console.log('[STUB] jeweetniet'); return gameState; }
export function effect_snelle_bijna_welloe(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0 && player.activeSlots[slotIndex].mp <= 10) {
		player.activeSlots[slotIndex].mp += 20;
		console.log('[ABILITY] Bijna Welloe: +20 MP');
	}
	return state;
}
export function effect_snelle_jantje_jantje_jantje(gameState) { console.log('[STUB] jantje_jantje_jantje'); return gameState; }
export function effect_snelle_sleutelpuntje(gameState) { console.log('[STUB] sleutelpuntje'); return gameState; }
export function effect_snelle_dubbele_temminks(gameState) { console.log('[STUB] dubbele_temminks'); return gameState; }
export function effect_snelle_gevalletje_klakkeloos(gameState) { console.log('[STUB] gevalletje_klakkeloos'); return gameState; }
export function effect_snelle_frenssen(gameState) { console.log('[STUB] frenssen'); return gameState; }
export function effect_snelle_blensen(gameState) { console.log('[STUB] blensen'); return gameState; }

