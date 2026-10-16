// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

import { isHolderTextActive } from '../engine/synergy/isHolderTextActive.js';
import { resolveOwnTargetSlot } from '../engine/targets/resolveOwnTargetSlot.js';
import { PIECIES } from '../data/piecies.js';

// Card List 2.0 section files (one file per section; same effect_* names, so data effectIds stay).
export * from './piecie/mpPiecies.js';
export * from './piecie/substancePiecies.js';
export * from './piecie/gearPiecies.js';
export * from './piecie/attackPiecies.js';
export * from './piecie/utilityProtectPiecies.js';
export * from './piecie/petPiecies.js';
export * from './piecie/utilityDrawPiecies.js';
export * from './piecie/utilityDicePiecies.js';
export * from './piecie/utilityChainPiecies.js';
export * from './piecie/utilityPlacePiecies.js';
export * from './piecie/attackRevealPiecies.js';
export * from './piecie/utilityQuestPiecies.js';
export * from './piecie/utilityHandPiecies.js';
export * from './piecie/utilityWelloePiecies.js';

console.log('[ABILITY] piecieEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

// ─────────────────────────────────────────
// MOMENTUM-GAINING
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// ATTACK
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────

export function effect_mp_adjuster(gameState, playerId) {
	if (gameState.activePlace === 'place_momentum_stabilizer') {
		console.log('[ABILITY] MP Adjuster blocked by Momentum Stabilizer');
		return gameState;
	}

	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si >= 0) {
		state._mpAdjusterPending = { playerId, slotIndex: si };
	}
	console.log('[ABILITY] MP Adjuster: value selection pending UI');
	return state;
}

// ─────────────────────────────────────────
// PET PROTECTION
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// SUBSTANCE
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// DIGITAL EQUIPMENT
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// PHYSICAL EQUIPMENT
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// BOOSTER-ONLY ATTACK
// ─────────────────────────────────────────

