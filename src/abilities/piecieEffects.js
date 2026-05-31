// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

import { rollDie } from '../engine/deckEngine.js';
import { hasFoodDoubleSynergy } from '../engine/synergyResolver.js';
import { destroyActivePlace } from '../engine/gameState.js';
import { triggerPlaceDestroyedEffects } from './placeEffects.js';

console.log('[ABILITY] piecieEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function getFirstActiveSlotIndex(player) {
	return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

function getOpponentId(state, playerId) {
	return Object.keys(state.players).find(id => id !== playerId) || null;
}

// applyDamage — mutates a Mosje slot with clamp + level-regression (mirrors loseMP in mpManager).
// Use instead of direct `slot.mp -= X` to prevent negative MP and handle level overflow.
function applyDamage(mosje, amount) {
	if (!mosje || mosje.isDefeated || amount <= 0) return;
	mosje.mp -= amount;
	while (mosje.mp < 0) {
		if (mosje.level === 0) { mosje.mp = 0; break; }
		const overflow = -mosje.mp;
		mosje.level -= 1;
		mosje.mp = 100 - overflow;
	}
	mosje.mp = Math.max(0, mosje.mp);
	mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + amount;
}

function applyMPGain(player, si, amount, state, playerId) {
	// Apply mpAmplifier 50% bonus if active
	let total = amount;
	if (player.mpAmplifierActive) {
		total = Math.floor(amount * 1.5);
		player.mpAmplifierActive = false;
		console.log(`[ABILITY] MP Amplifier applied: ${amount} \u2192 ${total}`);
	}
	player.activeSlots[si].mp += total;
	return total;
}

// ─────────────────────────────────────────
// MOMENTUM-GAINING
// ─────────────────────────────────────────

export function effect_kannetje_melk(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const selected = state._pendingTargets?.own_slot_index;
	const si = Number.isInteger(selected) ? selected : getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const base = hasFoodDoubleSynergy(state, playerId) ? 50 : 25;
	applyMPGain(player, si, base, state, playerId);
	if (state._pendingTargets) delete state._pendingTargets.own_slot_index;
	console.log(`[ABILITY] Kannetje Melk: +${base} MP`);
	return state;
}

export function effect_broodje_doner(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const base = hasFoodDoubleSynergy(state, playerId) ? 70 : 35;
	applyMPGain(player, si, base, state, playerId);
	console.log(`[ABILITY] Broodje Doner: +${base} MP`);
	return state;
}

export function effect_ronald_kip(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	if (mosje.level < 2) { console.log('[ABILITY] Ronald Kip: level 2 required'); return state; }
	const hasRonald = player.activeSlots.some(s => s && !s.isDefeated && s.cardId === 'mosje_ronald_chef');
	const base = hasFoodDoubleSynergy(state, playerId) ? 100 : (hasRonald ? 60 : 50);
	applyMPGain(player, si, base, state, playerId);
	if (hasRonald && player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Ronald Kip: +${base} MP`);
	return state;
}

export function effect_chefs_special(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const hasRonald = player.activeSlots.some(s => s && !s.isDefeated && s.cardId?.startsWith('mosje_ronald'));
	const oppId = getOpponentId(state, playerId);
	let gain = 15;
	if (hasRonald && oppId) {
		const oppPieciesInHand = state.players[oppId].hand.filter(c => c.type === 'PIECIE').length;
		gain = oppPieciesInHand * 30;
	}
	applyMPGain(player, si, gain, state, playerId);
	console.log(`[ABILITY] Chef's Special: +${gain} MP`);
	return state;
}

export function effect_momentum_boost(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	applyMPGain(player, si, 15, state, playerId);
	player.questBonusMP = (player.questBonusMP || 0) + 10;
	console.log('[ABILITY] Momentum Boost: +15 MP, next quest +10 bonus');
	return state;
}

export function effect_eendjes_voeren(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const gain = (mosje.traits?.resilient || 0) >= 2 ? 40 : 30;
	applyMPGain(player, si, gain, state, playerId);
	console.log(`[ABILITY] Eendjes voeren: +${gain} MP`);
	return state;
}

export function effect_varkenspootjes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const hasBinti = player.activeSlots.some(s => s && !s.isDefeated && s.cardId?.startsWith('mosje_binti'));
	if (hasBinti) {
		applyMPGain(player, si, 60, state, playerId);
		console.log('[ABILITY] Varkenspootjes: Binti! +60 MP');
	} else {
		applyDamage(player.activeSlots[si], 30);
		console.log('[ABILITY] Varkenspootjes: no Binti \u2014 -30 MP');
	}
	return state;
}

export function effect_energy_surge(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
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
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) applyDamage(player.activeSlots[si], 10);
	const drawCount = Math.min(2, player.deck.length);
	player.hand.push(...player.deck.splice(0, drawCount));
	console.log(`[ABILITY] Warm Kannetje Melk: -10 MP, drew ${drawCount}`);
	return state;
}

// ─────────────────────────────────────────
// ATTACK
// ─────────────────────────────────────────

export function effect_affoe(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;

	// Target selection: use explicitly chosen targets if provided by UI (via _pendingTargets),
	// otherwise fall back to first active slot (used in tests and AI turns)
	let osi, si;
	const targets = state._pendingTargets;
	if (targets?.affoe_drain != null) {
		// Targets are encoded as "playerId_slot_index"
		const drainParts = targets.affoe_drain.split('_slot_');
		osi = parseInt(drainParts[1], 10);
	} else {
		osi = getFirstActiveSlotIndex(state.players[oppId]);
	}
	if (targets?.affoe_gain != null) {
		const gainParts = targets.affoe_gain.split('_slot_');
		si = parseInt(gainParts[1], 10);
	} else {
		si = getFirstActiveSlotIndex(player);
	}

	if (osi >= 0) applyDamage(state.players[oppId].activeSlots[osi], 15);
	if (si >= 0) applyMPGain(player, si, 10, state, playerId);
	delete state._pendingTargets;
	console.log('[ABILITY] Affoe: opponent -15 MP, self +10 MP');
	return state;
}

export function effect_super_saiyan_mos(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0 || player.activeSlots[si].level < 1) {
		console.log('[ABILITY] Super Saiyan Mos: level 1 required'); return state;
	}
	player.questBonusMP = (player.questBonusMP || 0) + 25;
	console.log('[ABILITY] Super Saiyan Mos: next quest drains +25 from opponent');
	return state;
}

export function effect_te_hard_gaan(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) applyDamage(state.players[oppId].activeSlots[osi], 25);
	console.log('[ABILITY] Te Hard Gaan: opponent -25 MP');
	return state;
}

export function effect_momentum_diefje(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	const oppId = getOpponentId(state, playerId);
	if (!player || !oppId) return state;
	const si = getFirstActiveSlotIndex(player);
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (si >= 0 && osi >= 0) {
		const stolen = Math.min(20, state.players[oppId].activeSlots[osi].mp);
		applyDamage(state.players[oppId].activeSlots[osi], stolen);
		player.activeSlots[si].mp += stolen;
		console.log(`[ABILITY] Momentum Diefje: stole ${stolen} MP`);
	}
	return state;
}

export function effect_snoeiertje(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	player.questBonusMP = (player.questBonusMP || 0) + 15;
	player.activeSlots[si].statusEffects.push({ type: 'SNOEIERTJE_COST', value: -15, turnsLeft: 1 });
	console.log('[ABILITY] Snoeiertje: +15 quest drain, -15 MP end of turn');
	return state;
}

export function effect_jantje_jantje(gameState, playerId) {
	// Needs UI: player must name a card. For now: just log as pending.
	console.log('[ABILITY] Jantje Jantje: requires UI input \u2014 skipped');
	return gameState;
}

export function effect_dikke_taks(gameState, playerId) {
	const state = cloneState(gameState);
	const opponents = Object.keys(state.players).filter(id => id !== playerId);
	const damage = opponents.length >= 3 ? 40 : 35;
	for (const oppId of opponents) {
		const osi = getFirstActiveSlotIndex(state.players[oppId]);
		if (osi >= 0) applyDamage(state.players[oppId].activeSlots[osi], damage);
	}
	const player = state.players[playerId];
	if (player.deck.length > 0) player.hand.push(...player.deck.splice(0, Math.min(2, player.deck.length)));
	console.log(`[ABILITY] Dikke Taks: all opponents -${damage} MP, drew 2`);
	return state;
}

export function effect_kleine_taks(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) {
		state.players[oppId].activeSlots[osi].statusEffects.push(
			{ type: 'KLEINE_TAKS', value: -10, turnsLeft: 4 }
		);
		console.log('[ABILITY] Kleine Taks: -10 MP/turn for 4 turns on opponent');
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

// Zie Je Die Dingetjes — Look at top 3 cards, keep 1 in hand, put the other 2 back.
// Two-call pattern:
//   Call 1: no chosenCardId → peeks top 3, stores _dingetjesPeek, deck unchanged
//   Call 2: chosenCardId + optional orderedRemainder[] → moves chosen card to hand,
//            puts the other 2 back (in orderedRemainder order if provided, else original order)
export function effect_zie_je_die_dingetjes(gameState, playerId, chosenCardId = null, orderedRemainder = null) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.deck.length === 0) return state;

	if (!chosenCardId) {
		// Call 1: peek only
		const top3 = player.deck.slice(0, 3);
		state._dingetjesPeek = { playerId, cards: top3.map(c => c.cardId) };
		console.log('[ABILITY] Zie je die dingetjes: peeked top 3:', state._dingetjesPeek.cards);
		return state;
	}

	// Call 2: resolve
	const top3 = player.deck.splice(0, 3);
	const chosen = top3.find(c => c.cardId === chosenCardId);
	if (chosen) {
		player.hand.push(chosen);
	}
	const remaining = top3.filter(c => c.cardId !== chosenCardId);

	// Reorder the 2 remaining cards if caller provided a preferred order
	let finalRemaining = remaining;
	if (Array.isArray(orderedRemainder) && orderedRemainder.length > 0) {
		const ordered = orderedRemainder
			.map(id => remaining.find(c => c.cardId === id))
			.filter(Boolean);
		const unordered = remaining.filter(c => !orderedRemainder.includes(c.cardId));
		finalRemaining = [...ordered, ...unordered];
	}

	// Put remaining 2 back at top of deck
	player.deck.unshift(...finalRemaining);

	delete state._dingetjesPeek;
	console.log('[ABILITY] Zie je die dingetjes: kept', chosenCardId, '— other 2 put back');
	return state;
}

export function effect_slecht_gezet(gameState) {
	if (!gameState.activePlace) {
		console.log('[ABILITY] Slecht Gezet: no active Place to destroy');
		return gameState;
	}
	let state = destroyActivePlace(cloneState(gameState));
	state = triggerPlaceDestroyedEffects(state, state.activePlayerId);
	console.log('[ABILITY] Slecht Gezet: active Place destroyed');
	return state;
}

export function effect_bong_hit_demolition(gameState, playerId) {
	let state = cloneState(gameState);
	if (state.activePlace) {
		state = destroyActivePlace(state);
		state = triggerPlaceDestroyedEffects(state, playerId);
	}
	const player = state.players[playerId];
	if (player) player.hand.push(...player.deck.splice(0, Math.min(2, player.deck.length)));
	console.log('[ABILITY] Bong Hit Demolition: Place destroyed + drew 2');
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
	if (!player || player.discard.length === 0) return state;
	// Retrieve top discard card to hand, mark as unplayable this turn
	const retrieved = player.discard.shift();
	retrieved._unplayableThisTurn = true;
	player.hand.push(retrieved);
	console.log('[ABILITY] TemPiecie: retrieved', retrieved.cardId, '(unplayable this turn)');
	return state;
}

export function effect_quest_prep(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.questPrepBonus = (player.questPrepBonus || 0) + 2;
	console.log('[ABILITY] Dubbele Dosis: +2 to next Quest roll');
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
	if (gameState.activePlace === 'place_welloe_graveyard') {
		console.log('[ABILITY] Mosje Reborn blocked by Welloe Graveyard');
		return gameState;
	}

	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.welloe.length === 0) {
		console.log('[ABILITY] Mosje Reborn: welloe pile is empty');
		return state;
	}
	// Auto-revive the most recently defeated Mosje with level-scaled MP
	const revived = player.welloe.shift();
	revived.isDefeated = false;
	revived.mp = revived.level === 2 ? 60 : revived.level === 1 ? 40 : 20;
	// Place in first empty slot
	const emptySlot = player.activeSlots.findIndex(s => s === null);
	if (emptySlot >= 0) {
		player.activeSlots[emptySlot] = revived;
	} else {
		// All slots full — cannot revive right now
		player.welloe.unshift(revived);
		console.log('[ABILITY] Mosje Reborn: no empty slot available');
		return state;
	}
	console.log('[ABILITY] Mosje Reborn: revived', revived.name, 'at', revived.mp, 'MP');
	return state;
}

export function effect_afblijven(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].immuneThisTurn = true;
	console.log('[ABILITY] Afblijven: cannot lose MP until next turn');
	return state;
}

export function effect_laat_me_chillen(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) {
		player.activeSlots[si].statusEffects.push({ type: 'MP_LOSS_REDUCTION', value: 20, turnsLeft: 1 });
	}
	console.log('[ABILITY] Laat me chillen: -20 MP loss reduction (one-time)');
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
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) {
		player.activeSlots[si].statusEffects.push({ type: 'WELLOE_SHIELD', value: 1, turnsLeft: 2 });
		console.log('[ABILITY] Mosje Shield: protected from Welloe for 2 turns');
	}
	return state;
}

export function effect_emergency_swap(gameState, playerId) {
	// Needs UI: copy which Mosje's ability? For now: log.
	console.log('[ABILITY] Emergency Swap: requires UI selection \u2014 pending');
	return gameState;
}

export function effect_battle_concert(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	state._battleConcertActive = playerId;
	console.log('[ABILITY] Battle Concert: Alyssa quest failure redirected to opponent');
	return state;
}

export function effect_stookerino(gameState, playerId) {
	// Needs UI: which card to discard from opponent's hand. For now: discard random.
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	if (opp.hand.length === 0) return state;
	const idx = Math.floor(Math.random() * opp.hand.length);
	const discarded = opp.hand.splice(idx, 1)[0];
	opp.discard.unshift(discarded);
	const player = state.players[playerId];
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += discarded.mpCost || 0;
	console.log('[ABILITY] Stookerino: discarded', discarded.cardId);
	return state;
}

export function effect_dingetje_toch(gameState, playerId) {
	// Wildcard — substitution flag; engine checks this when resolving requirements
	const state = cloneState(gameState);
	state._dingetjeTochActive = true;
	console.log('[ABILITY] Dingetje Toch: universal wildcard active');
	return state;
}

export function effect_popo_komt(gameState, playerId) {
	const state = cloneState(gameState);
	const totalMosjes = Object.values(state.players)
		.flatMap(p => p.activeSlots)
		.filter(s => s && !s.isDefeated).length;
	if (totalMosjes >= 3) {
		const afterDestroy = state.activePlace ? destroyActivePlace(state) : state;
		return triggerPlaceDestroyedEffects(afterDestroy, playerId);
		console.log('[ABILITY] Popo Komt: 3+ Mosjes \u2014 Place destroyed!');
	} else {
		console.log('[ABILITY] Popo Komt: not enough Mosjes on field');
	}
	return state;
}

export function effect_huisbaas(gameState, playerId) {
	// Needs UI: choose new Place from deck. For now just destroy.
	let state = cloneState(gameState);
	if (state.activePlace) {
		state = destroyActivePlace(state);
		state = triggerPlaceDestroyedEffects(state, playerId);
	}
	console.log('[ABILITY] Huisbaas: Place destroyed (new Place search pending UI)');
	return state;
}

export function effect_those_eyelashes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const hasMartin = player.activeSlots.some(s => s && !s.isDefeated &&
		(s.cardId?.includes('martin') || s.cardId?.includes('west')));
	if (!hasMartin) {
		console.log('[ABILITY] Those Eyelashes: no Martin/West on field');
		return state;
	}
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += 20;
	const oppIds = Object.keys(state.players).filter(id => id !== playerId);
	for (const oppId of oppIds) {
		const opp = state.players[oppId];
		if (opp.hand.length > 0) opp.hand.shift(); // discard 1
	}
	state._snelleBlocked = true;
	console.log('[ABILITY] Those Eyelashes: +20 MP, all opponents discard 1, Snelles blocked');
	return state;
}

export function effect_f1_telemetry(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const hasMartin = player.activeSlots.some(s => s && !s.isDefeated &&
		(s.cardId?.includes('martin') || s.cardId?.includes('west')));
	if (hasMartin) {
		player.activeSlots[si].mp += 40;
		player.hand.push(...player.deck.splice(0, Math.min(2, player.deck.length)));
		player.questBonusMP = (player.questBonusMP || 0) + 20;
		console.log('[ABILITY] F1 Telemetry: +40 MP, drew 2, +20 quest bonus');
	} else {
		player.activeSlots[si].mp += 15;
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
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	if (mosje.mp < 60) mosje.mp = 60;
	if (mosje.mp > 90) mosje.mp = 90;
	console.log(`[ABILITY] Perfect Setup: MP set to ${mosje.mp}`);
	return state;
}

export function effect_mp_adjuster(gameState, playerId) {
	if (gameState.activePlace === 'place_momentum_stabilizer') {
		console.log('[ABILITY] MP Adjuster blocked by Momentum Stabilizer');
		return gameState;
	}

	// Needs UI: choose exact value 30-100. Default: set to 50.
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp = 50;
	console.log('[ABILITY] MP Adjuster: set to 50 (UI pending for exact value)');
	return state;
}

export function effect_chain_reaction(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.chainReactionActive = true;
	console.log('[ABILITY] Chain Reaction: free Piecie activation this turn');
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
	if (gameState.activePlace === 'place_welloe_graveyard') {
		console.log('[ABILITY] Call of Welloes blocked by Welloe Graveyard');
		return gameState;
	}

	// Intended: choose a Mosje in a Welloe pile and summon it to the field at
	// Level 1, 0 MP. This Piecie stays linked to that Mosje; if this Piecie
	// leaves play, that Mosje returns to Welloe. For now, reuse Mosje Reborn as
	// the UI/browser stub until linked field attachments exist.
	return effect_mosje_reborn(gameState, playerId);
}

export function effect_welloe_force(gameState, playerId) {
	// Redirect resolving effect — complex; just discard 1 for now.
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.hand.length === 0) return state;
	player.discard.unshift(player.hand.shift());
	state._welloeForceActive = true;
	console.log('[ABILITY] Welloe Force: discard 1, redirect pending UI');
	return state;
}

export function effect_kan_het(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll === 6) {
		applyMPGain(player, si, 50, state, playerId);
		console.log(`[ABILITY] Kan het?!: rolled ${roll} → KAN HET! +50 MP`);
	} else {
		applyDamage(player.activeSlots[si], 10);
		console.log(`[ABILITY] Kan het?!: rolled ${roll} → nope, -10 MP`);
	}
	return state;
}

// ─────────────────────────────────────────
// PET PROTECTION
// ─────────────────────────────────────────

export function effect_bowie_stormey(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const petTags = ['GANDOE', 'DJ', 'TUK', 'MICHELLE'];
	for (const slot of player.activeSlots) {
		if (!slot || slot.isDefeated) continue;
		const cardTags = slot.traits ? Object.keys(slot.traits) : [];
		// Apply to Mosjes matching pet synergy tags
		slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
	}
	console.log('[ABILITY] Bowie & Stormey: MP loss halved for 2 turns');
	return state;
}

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

export function effect_vianna_poes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (!slot || slot.isDefeated) continue;
		slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 2 });
	}
	console.log('[ABILITY] ViannaPoes: MP loss halved for 2 turns (Cless)');
	return state;
}

// ─────────────────────────────────────────
// SUBSTANCE
// ─────────────────────────────────────────

export function effect_grammetje_pieter(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll >= 4) {
		player.activeSlots[si].mp += 30;
		console.log(`[ABILITY] Grammetje Pieter: rolled ${roll} \u2192 +30 MP`);
	} else {
		applyDamage(player.activeSlots[si], 15);
		console.log(`[ABILITY] Grammetje Pieter: rolled ${roll} \u2192 -15 MP`);
	}
	return state;
}

export function effect_dikke_jonko(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += 25;
	const oppIds = Object.keys(state.players).filter(id => id !== playerId);
	for (const oppId of oppIds) {
		const opp = state.players[oppId];
		const osi = getFirstActiveSlotIndex(opp);
		if (osi >= 0) opp.activeSlots[osi].mp += 10;
		if (opp.deck.length > 0) opp.hand.push(opp.deck.shift());
	}
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log('[ABILITY] Dikke Jonko: +25 MP self, +10 MP + draw for all');
	return state;
}

export function effect_stripje_bennies(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) applyDamage(player.activeSlots[si], 20);
	player.hand.push(...player.deck.splice(0, Math.min(3, player.deck.length)));
	console.log('[ABILITY] Stripje Bennies: draw 3, -20 MP');
	return state;
}

export function effect_tikker(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	player.activeSlots[si].mp += 40;
	player.activeSlots[si].statusEffects.push({ type: 'QUEST_BLOCKED', value: 0, turnsLeft: 1 });
	console.log('[ABILITY] Tikker: +40 MP, QUEST_BLOCKED next turn');
	return state;
}

export function effect_straffoe(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) {
		applyDamage(state.players[oppId].activeSlots[osi], 30);
		console.log('[ABILITY] Straffoe: opponent -30 MP');
	}
	return state;
}

export function effect_larry_zegeltje(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += 20;
	player.questPrepBonus = (player.questPrepBonus || 0) + 1;
	console.log('[ABILITY] Larry Zegeltje: +20 MP, +1 quest roll bonus');
	return state;
}

// ─────────────────────────────────────────
// DIGITAL EQUIPMENT
// ─────────────────────────────────────────

function getDigitalMP(mosje) {
	if (mosje.subtype !== 'DIGITAL') return 5;
	const level = mosje.level || 1;
	if (level >= 3) return 40;
	if (level === 2) return 25;
	return 15;
}

export function effect_keyboard(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const mp = getDigitalMP(mosje);
	applyMPGain(player, si, mp, state, playerId);
	// Flavor bonus: draw 1 card
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Keyboard: +${mp} MP${mosje.subtype === 'DIGITAL' ? ' (Digital Lv' + (mosje.level||1) + ')' : ' (base)'}, drew 1`);
	return state;
}

export function effect_mouse(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const mp = getDigitalMP(mosje);
	applyMPGain(player, si, mp, state, playerId);
	// Flavor bonus: draw 1 card (peek UI for "look at top 2" deferred to UI phase)
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Mouse: +${mp} MP${mosje.subtype === 'DIGITAL' ? ' (Digital Lv' + (mosje.level||1) + ')' : ' (base)'}, drew 1`);
	return state;
}

export function effect_controller(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const mp = getDigitalMP(mosje);
	applyMPGain(player, si, mp, state, playerId);
	// Flavor bonus: +1 quest roll this turn
	player.questPrepBonus = (player.questPrepBonus || 0) + 1;
	console.log(`[ABILITY] Controller: +${mp} MP${mosje.subtype === 'DIGITAL' ? ' (Digital Lv' + (mosje.level||1) + ')' : ' (base)'}, +1 quest bonus`);
	return state;
}

// ─────────────────────────────────────────
// BOOSTER-ONLY ATTACK
// ─────────────────────────────────────────

export function effect_continuous_assault(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) {
		state.players[oppId].activeSlots[osi].statusEffects.push(
			{ type: 'CONTINUOUS_ASSAULT', value: -15, turnsLeft: 3 }
		);
		console.log('[ABILITY] Continuous Assault: -15 MP/turn for 3 turns on opponent');
	}
	return state;
}

export function effect_harde_didde(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) applyDamage(state.players[oppId].activeSlots[osi], 50);
	console.log('[ABILITY] Harde Didde: opponent -50 MP');
	return state;
}

export function effect_mp_hemorrhage(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) {
		state.players[oppId].activeSlots[osi].statusEffects.push(
			{ type: 'HEMORRHAGE', value: -20, turnsLeft: 5 }
		);
		console.log('[ABILITY] MP Hemorrhage: -20 MP/turn for 5 turns');
	}
	return state;
}

export function effect_klaar_met_jou(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	const osi = getFirstActiveSlotIndex(opp);
	if (osi >= 0) {
		applyDamage(opp.activeSlots[osi], 40);
		if (opp.hand.length > 0) opp.hand.pop();
		console.log('[ABILITY] Klaar met jou: opponent -40 MP, discard 1');
	}
	return state;
}
