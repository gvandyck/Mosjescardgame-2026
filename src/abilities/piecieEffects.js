// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

import { rollDie } from '../engine/deckEngine.js';
import { roundToFive } from '../engine/roundToFive.js';
import { isHolderTextActive } from '../engine/synergy/isHolderTextActive.js';
import { MOSJES } from '../data/mosjes.js';
import { createMosjeSlot } from '../engine/mp/createMosjeSlot.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from '../engine/mp/applyMpLossToSlot.js';
import { isFresh } from '../engine/fresh/isFresh.js';
import { resolveOwnTargetSlot } from '../engine/targets/resolveOwnTargetSlot.js';
import { resolveOppTargetSlot } from '../engine/targets/resolveOppTargetSlot.js';
import { PIECIES } from '../data/piecies.js';
import { addToGraveyard } from '../engine/graveyardUtils.js';
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

console.log('[ABILITY] piecieEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function getOpponentId(state, playerId) {
	return Object.keys(state.players).find(id => id !== playerId) || null;
}

// applyDamage — thin wrapper over the 2.0 loss funnel (applyMpLossToSlot): §2g pipeline,
// subtract, tracking, getemt. `playerId` is the OWNER of the slot being hit.
function applyDamage(state, playerId, mosje, amount, source = 'DRAIN', byPlayerId = null) {
	if (!mosje || mosje.isDefeated || !(amount > 0)) return { final: 0, getemt: null };
	return applyMpLossToSlot({ state, playerId, slot: mosje, amount, source, byPlayerId });
}

// U8 — Entry Protection: hostile effect damage fizzles against a freshly
// entered Mosje (until its owner's next turn starts). Use for OPPONENT-
// targeted damage only — self-effects, gambles and cost payments keep
// calling applyDamage directly (costs are never blocked, see U7).
function applyHostileDamage(state, playerId, mosje, amount) {
	if (!mosje) return false;
	if (isFresh(mosje)) {
		console.log(`[ABILITY] 🛡️ Entry protection: ${mosje.name} just entered play — ${amount} damage fizzled`);
		return false;
	}
	applyDamage(state, playerId, mosje, amount, 'DRAIN', getOpponentId(state, playerId));
	return true;
}

// U8 — Entry Protection also blocks hostile status effects: a debuff aimed at
// a freshly entered Mosje fizzles. Use for OPPONENT-targeting pushes only —
// buffs on your own Mosjes are always allowed.
function pushHostileStatus(mosje, effect, label) {
	if (isFresh(mosje)) {
		console.log(`[ABILITY] 🛡️ Entry protection: ${mosje.name} just entered play — ${effect.type} fizzled`);
		return false;
	}
	mosje.statusEffects.push(effect);
	if (label) console.log(label);
	return true;
}

// Binti holder text (Coert Tech on field): each food Piecie you activate gives its Mosje +10 extra.
function bintiFoodExtra(state, playerId) {
	return isHolderTextActive(state, playerId, 'mosje_binti') ? 10 : 0;
}

function applyMPGain(player, si, amount, state, playerId) {
	// Apply mpAmplifier 50% bonus if active
	let total = amount;
	if (player.mpAmplifierActive) {
		total = roundToFive(amount * 1.5);  // game rule: MP stays on the 5-grid
		player.mpAmplifierActive = false;
		console.log(`[ABILITY] MP Amplifier applied: ${amount} \u2192 ${total}`);
	}
	// 2.0: 100+ levels the Mosje up to 0 MP, Level 3 stops at 95 (applyGainToSlot).
	applyGainToSlot(player.activeSlots[si], total, { turnNumber: state.turnNumber });
	return total;
}

// ─────────────────────────────────────────
// MOMENTUM-GAINING
// ─────────────────────────────────────────

export function effect_ronald_kip(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const hasRonald = player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef');
	const base = (hasRonald ? 60 : 50) + bintiFoodExtra(state, playerId);
	applyMPGain(player, si, base, state, playerId);
	if (hasRonald && player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Ronald Kip: +${base} MP`);
	return state;
}

export function effect_chefs_special(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const hasRonald = player.activeSlots.some(s => s && !s.isDefeated && s.cardId?.startsWith('mosje_ronald'));
	const oppId = getOpponentId(state, playerId);
	let gain = 15;
	if (hasRonald && oppId) {
		const oppPieciesInHand = state.players[oppId].hand.filter(c => c.type === 'PIECIE').length;
		gain = oppPieciesInHand * 30;
	}
	gain += bintiFoodExtra(state, playerId);
	applyMPGain(player, si, gain, state, playerId);
	console.log(`[ABILITY] Chef's Special: +${gain} MP`);
	return state;
}

export function effect_energy_surge(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	if (player.activeSlots[si].mp >= 30) {
		console.log('[ABILITY] Shoettoe: blocked (MP >= 30)');
		return state;
	}
	applyMPGain(player, si, 20, state, playerId);
	console.log('[ABILITY] Shoettoe: +20 MP');
	return state;
}

export function effect_warm_kannetje_melk(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si >= 0) applyDamage(state, playerId, player.activeSlots[si], 10);
	const drawCount = Math.min(2, player.deck.length);
	player.hand.push(...player.deck.splice(0, drawCount));
	console.log(`[ABILITY] Warm Kannetje Melk: -10 MP, drew ${drawCount}`);
	return state;
}

// ─────────────────────────────────────────
// ATTACK
// ─────────────────────────────────────────

export function effect_snoeiertje(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	// questBonusMP handles the real logic (+15 MP on quest success this turn).
	// STUB-08: SNOEIERTJE_COST status effect push removed — it was never consumed anywhere.
	player.questBonusMP = (player.questBonusMP || 0) + 15;
	console.log('[ABILITY] Snoeiertje: +15 quest bonus MP applied');
	return state;
}

export function effect_jantje_jantje(gameState, playerId) {
	// Needs UI: player must name a card. For now: just log as pending.
	console.log('[ABILITY] Jantje Jantje: requires UI input \u2014 skipped');
	return gameState;
}

export function effect_kleine_taks(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = resolveOppTargetSlot(state, oppId);
	if (osi >= 0) {
		pushHostileStatus(
			state.players[oppId].activeSlots[osi],
			{ type: 'KLEINE_TAKS', value: -10, turnsLeft: 4 },
			'[ABILITY] Kleine Taks: -10 MP/turn for 4 turns on opponent'
		);
	}
	return state;
}

// ─────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────

export function effect_pot_of_weed(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const drawn = Math.min(2, player.deck.length);
	player.hand.push(...player.deck.splice(0, drawn));
	console.log(`[ABILITY] Pot of Weed: drew ${drawn} card(s)`);
	return state;
}

export function effect_redbull(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.abilityDoubleTrigger = true;
	console.log('[ABILITY] Redbull: active Mosje ability triggers twice this turn');
	return state;
}

export function effect_tweede_kans(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.hasRerolledDieThisTurn = false;  // reset so they can reroll
	state._rerollGranted = true;
	console.log('[ABILITY] Tweede Kans: free die reroll granted');
	return state;
}

export function effect_bagga_of_greed(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.hand.push(...player.deck.splice(0, Math.min(2, player.deck.length)));
	// Discard 1 — UI picks which. Flag for UI.
	state._baggaDiscard = true;
	console.log('[ABILITY] Bagga of Greed: drew 2, must discard 1 (pending UI)');
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

export function effect_tempiecie(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.graveyard?.length === 0) return state;
	// Retrieve top discard card to hand, mark as unplayable this turn
	const retrieved = player.graveyard.shift();
	retrieved._unplayableThisTurn = true;
	player.hand.push(retrieved);
	console.log('[ABILITY] TemPiecie: retrieved', retrieved.cardId, '(unplayable this turn)');
	return state;
}

export function effect_loaded_dice(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	// KNOWN GAP (Phase 59): the Jeffrey "reroll 1 die" part is not implemented.
	player.questExtraDice = (player.questExtraDice || 0) + 1;
	console.log('[ABILITY] Loaded Dice: +1 die on the next Quest');
	return state;
}

export function effect_perfect_rhythm(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	player.perfectRhythmDrawNextPiecie = true;
	const ddrChrisSlotIndex = player.activeSlots.findIndex(
		slot => slot && !slot.isDefeated && slot.cardId === 'mosje_chris_ddr'
	);
	const hasDdrChris = ddrChrisSlotIndex >= 0;
	if (hasDdrChris) applyMPGain(player, ddrChrisSlotIndex, 10, state, playerId);
	console.log(`[ABILITY] Perfect Rhythm: each later Piecie activation draws 1${hasDdrChris ? ', +10 MP (DDR Chris)' : ''}`);
	return state;
}

export function effect_dikke_plaat(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const hasAlyssaFissa = player.activeSlots.some(
		slot => slot && !slot.isDefeated && slot.cardId === 'mosje_alyssa_fissa'
	);
	// KNOWN GAP (Phase 59): the DJ / Alyssa Fissa Fissa "reroll 1 die" part is not implemented.
	void hasAlyssaFissa;
	player.questExtraDice = (player.questExtraDice || 0) + 1;
	console.log('[ABILITY] Dikke Plaat: +1 die on the next Quest');
	return state;
}

export function effect_mp_amplifier(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.mpAmplifierActive = true;
	console.log('[ABILITY] MP Amplifier: next MP gain +50%');
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

export function effect_synergy_field(gameState, playerId) {
	const state = cloneState(gameState);
	state.synergyFieldTurnsLeft = 3;
	state.synergyFieldOwner = playerId;
	console.log('[ABILITY] Synergy Field: +10 to all restore gains for 3 turns');
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

export function effect_battle_concert(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	state._battleConcertActive = playerId;
	console.log('[ABILITY] Battle Concert: Alyssa quest failure redirected to opponent');
	return state;
}

export function effect_dingetje_toch(gameState, playerId) {
	// Wildcard — substitution flag; engine checks this when resolving requirements
	const state = cloneState(gameState);
	state._dingetjeTochActive = true;
	console.log('[ABILITY] Dingetje Toch: universal wildcard active');
	return state;
}

export function effect_those_eyelashes(gameState, playerId) {
	let state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const hasMartin = player.activeSlots.some(s => s && !s.isDefeated &&
		(s.cardId?.includes('martin') || s.cardId?.includes('west')));
	if (!hasMartin) {
		console.log('[ABILITY] Those Eyelashes: no Martin/West on field');
		return state;
	}
	const si = resolveOwnTargetSlot(state, playerId);
	if (si >= 0) applyGainToSlot(player.activeSlots[si], 20, { turnNumber: state.turnNumber });
	const oppIds = Object.keys(state.players).filter(id => id !== playerId);
	for (const oppId of oppIds) {
		let opp = state.players[oppId];
		if (opp.hand.length > 0) {
			const [removed] = opp.hand.splice(0, 1);
			const cardId = removed?.cardId ?? removed;
			state = addToGraveyard(state, oppId, cardId, 'discarded');
			opp = state.players[oppId];
		}
	}
	// Store the blocked opponent's playerId (consumed by playSnellie), not boolean true.
	if (oppIds[0]) state._snelleBlocked = oppIds[0];
	console.log('[ABILITY] Those Eyelashes: +20 MP, all opponents discard 1, Snelles blocked');
	return state;
}

export function effect_f1_telemetry(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const hasMartin = player.activeSlots.some(s => s && !s.isDefeated &&
		(s.cardId?.includes('martin') || s.cardId?.includes('west')));
	if (hasMartin) {
		applyGainToSlot(player.activeSlots[si], 40, { turnNumber: state.turnNumber });
		player.hand.push(...player.deck.splice(0, Math.min(2, player.deck.length)));
		player.questBonusMP = (player.questBonusMP || 0) + 20;
		console.log('[ABILITY] F1 Telemetry: +40 MP, drew 2, +20 quest bonus');
	} else {
		applyGainToSlot(player.activeSlots[si], 15, { turnNumber: state.turnNumber });
		player.hand.push(...player.deck.splice(0, Math.min(1, player.deck.length)));
		console.log('[ABILITY] F1 Telemetry: +15 MP, drew 1');
	}
	return state;
}

export function effect_perfect_setup(gameState, playerId) {
	if (gameState.activePlace === 'place_momentum_stabilizer') {
		console.log('[ABILITY] Perfect Setup blocked by Momentum Stabilizer');
		return gameState;
	}

	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	if (mosje.mp < 60) mosje.mp = 60; // mp-direct-ok: V4 clamp effect, Phase 59
	if (mosje.mp > 90) mosje.mp = 90; // mp-direct-ok: V4 clamp effect, Phase 59
	console.log(`[ABILITY] Perfect Setup: MP set to ${mosje.mp}`);
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

export function effect_kan_het(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll === 6) {
		applyMPGain(player, si, 50, state, playerId);
		console.log(`[ABILITY] Kan het?!: rolled ${roll} → KAN HET! +50 MP`);
	} else {
		applyDamage(state, playerId, player.activeSlots[si], 10);
		console.log(`[ABILITY] Kan het?!: rolled ${roll} → nope, -10 MP`);
	}
	return state;
}

// ─────────────────────────────────────────
// PET PROTECTION
// ─────────────────────────────────────────

export function effect_tony(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (!slot || slot.isDefeated) continue;
		slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
	}
	console.log('[ABILITY] Tony: MP loss halved for 2 turns');
	return state;
}

export function effect_gekke_vogels(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (!slot || slot.isDefeated) continue;
		slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
	}
	console.log('[ABILITY] Gekke Vogels: MP loss halved for 2 turns (Jisca)');
	return state;
}

export function effect_katjegang(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (!slot || slot.isDefeated) continue;
		slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
	}
	console.log('[ABILITY] KatjeGang: MP loss halved for 2 turns (Alyssa)');
	return state;
}

// ─────────────────────────────────────────
// SUBSTANCE
// ─────────────────────────────────────────

export function effect_stripje_bennies(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si >= 0) applyDamage(state, playerId, player.activeSlots[si], 20);
	player.hand.push(...player.deck.splice(0, Math.min(3, player.deck.length)));
	console.log('[ABILITY] Stripje Bennies: draw 3, -20 MP');
	return state;
}

// ─────────────────────────────────────────
// DIGITAL EQUIPMENT
// ─────────────────────────────────────────

// ─────────────────────────────────────────
// PHYSICAL EQUIPMENT
// ─────────────────────────────────────────

export function effect_dumbbells(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const isPhysical = mosje.subtype === 'FIGHTING';
	const mp = isPhysical ? 20 : 5;
	applyMPGain(player, si, mp, state, playerId);
	// Flavor bonus: draw 1 card only at Physical ★★★ (level >= 3)
	if (isPhysical && (mosje.level || 1) >= 3 && player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		console.log(`[ABILITY] Dumbbells: +${mp} MP (Physical Lv${mosje.level}), drew 1`);
	} else {
		console.log(`[ABILITY] Dumbbells: +${mp} MP${isPhysical ? ' (Physical)' : ' (base)'}`);
	}
	return state;
}

export function effect_skipping_rope(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = resolveOwnTargetSlot(state, playerId);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const isPhysical = mosje.subtype === 'FIGHTING';
	if (isPhysical) {
		player.questExtraDice = (player.questExtraDice || 0) + 1;
	}
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Skipping Rope:${isPhysical ? ' +1 quest bonus,' : ''} drew 1`);
	return state;
}

// ─────────────────────────────────────────
// BOOSTER-ONLY ATTACK
// ─────────────────────────────────────────

export function effect_continuous_assault(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = resolveOppTargetSlot(state, oppId);
	if (osi >= 0) {
		pushHostileStatus(
			state.players[oppId].activeSlots[osi],
			{ type: 'CONTINUOUS_ASSAULT', value: -15, turnsLeft: 3 },
			'[ABILITY] Continuous Assault: -15 MP/turn for 3 turns on opponent'
		);
	}
	return state;
}

export function effect_mp_hemorrhage(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = resolveOppTargetSlot(state, oppId);
	if (osi >= 0) {
		pushHostileStatus(
			state.players[oppId].activeSlots[osi],
			{ type: 'HEMORRHAGE', value: -20, turnsLeft: 5 },
			'[ABILITY] MP Hemorrhage: -20 MP/turn for 5 turns'
		);
	}
	return state;
}

