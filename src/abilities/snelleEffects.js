// snelleEffects.js — One function per Snelle Piecie (instant) card's effect.
// Filled in Phase 4.

import { loseMP } from '../engine/mpManager.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';

console.log('[ABILITY] snelleEffects.js loaded');

// Rewritten Snelle live in section files under ./snelle/ (Phase 60); V4 bodies of the others stay here until their plan.
export * from './snelle/snelleMpEffects.js';

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

export function effect_snelle_emergency_healings(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players?.[playerId];
	if (!player) return state;
	const slotIndex = player.activeSlots.findIndex(s => s !== null && !s.isDefeated);
	if (slotIndex >= 0) {
		const mosje = player.activeSlots[slotIndex];
		const resilient = mosje.traits?.resilient || 0;
		const healAmount = resilient >= 2 ? 35 : 25;
		applyGainToSlot(mosje, healAmount, { turnNumber: state.turnNumber });
	}
	console.log('[ABILITY] Emergency Healings (snelle): unconditional heal');
	return state;
}

export function effect_snelle_lucky_coin(gameState, playerId) {
	let state = JSON.parse(JSON.stringify(gameState));
	const result = state._pendingTargets?.lucky_coin_result;

	if (result === 'heads') {
		if (!state._snelleFlags) state._snelleFlags = {};
		if (!state._snelleFlags.forceReroll) state._snelleFlags.forceReroll = {};
		state._snelleFlags.forceReroll[playerId] = true;
		console.log('[ABILITY] Lucky Coin: heads → reroll token granted');
	} else if (result === 'tails') {
		const slotIndex = state._pendingTargets?.lucky_coin_tails_slot;
		const player = state.players[playerId];
		if (player && Number.isInteger(slotIndex) && player.activeSlots[slotIndex]) {
			state = loseMP(state, playerId, slotIndex, 10, 'DRAIN');
			console.log(`[ABILITY] Lucky Coin: tails → -10 MP to slot ${slotIndex}`);
		}
	}

	if (state._pendingTargets) {
		delete state._pendingTargets.lucky_coin_result;
		delete state._pendingTargets.lucky_coin_tails_slot;
	}
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

// Perfect Dodge — negate the next ATTACK Piecie targeting you + gain 15 MP
export function effect_snelle_perfect_dodge(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.negateNextAttack = state._snelleFlags.negateNextAttack || {};
	state._snelleFlags.negateNextAttack[playerId] = true;
	console.log('[ABILITY] Perfect Dodge: next ATTACK Piecie negated; +15 MP on trigger');
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

// Not Today! — negate next Mosje elimination for this player; stay at 5 MP instead
export function effect_snelle_negate_elimination(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.negateNextElimination = state._snelleFlags.negateNextElimination || {};
	state._snelleFlags.negateNextElimination[playerId] = true;
	console.log('[ABILITY] Not Today!: next Mosje elimination negated — stays at 5 MP');
	return state;
}

// Drain Reversal — negate next incoming drain + reflect that damage to opponent
export function effect_snelle_drain_reversal(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.drainReversal = state._snelleFlags.drainReversal || {};
	state._snelleFlags.drainReversal[playerId] = true;
	console.log('[ABILITY] Drain Reversal: next incoming drain will be reversed');
	return state;
}

// The Protector — reduce next ally MP loss by 30
export function effect_snelle_the_protector(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.mpLossReduction = state._snelleFlags.mpLossReduction || {};
	state._snelleFlags.mpLossReduction[playerId] = 30;
	console.log('[ABILITY] The Protector: next MP loss reduced by 30');
	return state;
}

// Je Weet Niet — force opponent to reroll their next quest die
export function effect_snelle_jeweetniet(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	if (oppId) {
		state._snelleFlags.forceReroll = state._snelleFlags.forceReroll || {};
		state._snelleFlags.forceReroll[oppId] = true;
	}
	console.log('[ABILITY] Je Weet Niet: opponent must reroll next quest die');
	return state;
}

// Sleutelpuntje — +1 bonus on next quest dice roll
export function effect_snelle_sleutelpuntje(gameState, playerId) {
	const state = JSON.parse(JSON.stringify(gameState));
	state._snelleFlags = state._snelleFlags || {};
	state._snelleFlags.questDiceBonus = (state._snelleFlags.questDiceBonus || 0) + 1;
	console.log('[ABILITY] Sleutelpuntje: +1 on next quest dice roll');
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

