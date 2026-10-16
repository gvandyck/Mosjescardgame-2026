// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

import { isHolderTextActive } from '../engine/synergy/isHolderTextActive.js';
import { MOSJES } from '../data/mosjes.js';
import { createMosjeSlot } from '../engine/mp/createMosjeSlot.js';
import { resolveOwnTargetSlot } from '../engine/targets/resolveOwnTargetSlot.js';
import { PIECIES } from '../data/piecies.js';
import { canLeaveWelloePile } from '../engine/table/canLeaveWelloePile.js';

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

export function effect_redbull(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.abilityDoubleTrigger = true;
	console.log('[ABILITY] Redbull: active Mosje ability triggers twice this turn');
	return state;
}

export function effect_dubbele_ding(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.instantPiecieThisTurn = true;
	player.dubbeleActivations = 2;  // UI uses this counter
	console.log('[ABILITY] Dubbele Ding: 2 instant Piecies from hand');
	return state;
}

export function effect_mosje_reborn(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (!canLeaveWelloePile(state)) {
		console.log('[ABILITY] Mosje Reborn: blocked by Welloe Graveyard');
		return state;
	}
	const mosjesToRevive = (player.welloePile || []).filter(e => e.type === 'MOSJE');
	if (mosjesToRevive.length === 0) {
		console.log('[ABILITY] Mosje Reborn: no Mosjes in the Welloe pile');
		return state;
	}
	const emptySlot = player.activeSlots.findIndex(s => s === null);
	if (emptySlot < 0) {
		console.log('[ABILITY] Mosje Reborn: no empty slot available');
		return state;
	}
	const reviveIdx = player.welloePile.findIndex(e => e.type === 'MOSJE');
	const [revived] = player.welloePile.splice(reviveIdx, 1);
	const mosjeDef = MOSJES.find(m => m.id === revived.cardId);
	const startMP = mosjeDef?.startMP ?? 0;
	if (mosjeDef) {
		// Revived at Level 1 through the single slot factory (Card List: "at Level 1")
		const slot = createMosjeSlot(mosjeDef, { level: 1, mp: startMP + 40 });
		player.activeSlots[emptySlot] = slot;
		revived.mp = slot.mp; // mp-direct-ok: record copy of the fresh slot, no change to a Mosje
	} else {
		revived.isDefeated = false;
		revived.mp = startMP + 40;
		revived.level = 1;
		revived.abilityUsedThisTurn = false;
		revived.immuneThisTurn = false;
		revived.mpLostThisTurn = 0;
		player.activeSlots[emptySlot] = revived;
	}
	console.log(`[ABILITY] Mosje Reborn: revived ${revived.name} at ${revived.mp} MP (${startMP} base + 40)`);
	return state;
}

export function effect_mosje_shield(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si >= 0) {
		player.activeSlots[si].statusEffects.push({ type: 'WELLOE_SHIELD', value: 1, turnsLeft: 2 });
		console.log('[ABILITY] Mosje Shield: protected from Welloe for 2 turns');
	}
	return state;
}

export function effect_leipe_swap(gameState, playerId) {
	const state = cloneState(gameState);
	const t = state._pendingTargets || {};
	const yourSlotIndex = t.leipeYourSlot;
	const oppId = t.leipeOppId;
	const oppSlotIndex = t.leipeOppSlot;
	const me = state.players[playerId];
	const opp = oppId ? state.players[oppId] : null;
	if (!me || !opp || yourSlotIndex == null || oppSlotIndex == null) return state;
	const yourSlot = me.activeSlots?.[yourSlotIndex];
	const oppSlot = opp.activeSlots?.[oppSlotIndex];
	if (!yourSlot || !oppSlot || yourSlot.isDefeated || oppSlot.isDefeated) return state;
	const tmp = yourSlot.mp;
	yourSlot.mp = oppSlot.mp; // mp-direct-ok: swap is never a gain or loss, handoff §2b
	oppSlot.mp = tmp; // mp-direct-ok: swap is never a gain or loss, handoff §2b
	state._leipeSwap = { byPlayerId: playerId, yourSlotIndex, oppId, oppSlotIndex };
	if (state._pendingTargets) {
		delete state._pendingTargets.leipeYourSlot;
		delete state._pendingTargets.leipeOppId;
		delete state._pendingTargets.leipeOppSlot;
	}
	console.log('[PIECIE] Leipe Swap: swapped MP', `${playerId}#${yourSlotIndex}`, '<->', `${oppId}#${oppSlotIndex}`);
	return state;
}

export function effect_dingetje_toch(gameState, playerId) {
	// Wildcard — substitution flag; engine checks this when resolving requirements
	const state = cloneState(gameState);
	state._dingetjeTochActive = true;
	console.log('[ABILITY] Dingetje Toch: universal wildcard active');
	return state;
}

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

export function effect_double_trigger(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.abilityDoubleTrigger = true;
	console.log('[ABILITY] Double Trigger: ability triggers twice this turn');
	return state;
}

export function effect_call_of_welloes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (!canLeaveWelloePile(state)) return { ...state, _callOfWelloesCancel: true };
	const mosjeEntries = (player.welloePile || []).filter(e => e.type === 'MOSJE');
	if (mosjeEntries.length === 0) {
		return { ...state, _callOfWelloesCancel: true };
	}
	if (!Array.isArray(player.activeSlots)) player.activeSlots = [null, null];
	const openSlot = player.activeSlots.findIndex(s => s === null);
	if (openSlot < 0) {
		return { ...state, _callOfWelloesCancel: true };
	}
	const welloeOptions = mosjeEntries.map(w => ({
		cardId: w.cardId, name: w.name, mp: w.mp, level: w.level,
	}));
	state._callOfWelloesPending = { playerId, welloeOptions };
	console.log('[ABILITY] Call of the Welloes: welloe options pending UI pick');
	return state;
}

export function effect_welloe_force(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	// Energy is paid by activatePiecie (Phase 54); no MP tribute.
	// Set 3-turn damage redirect. UI picks the target opponent Mosje.
	state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
	console.log('[ABILITY] Welloe Force: 3-turn redirect active, target pending UI');
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

