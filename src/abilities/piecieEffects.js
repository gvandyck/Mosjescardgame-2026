// piecieEffects.js — One function per Piecie card's effect.
// Filled in Phase 4.

import { rollDie } from '../engine/deckEngine.js';
import { roundToFive } from '../engine/roundToFive.js';
import { hasFoodDoubleSynergy } from '../engine/synergyResolver.js';
import { destroyActivePlace } from '../engine/gameState.js';
import { triggerPlaceDestroyedEffects } from './placeEffects.js';
import { MOSJES } from '../data/mosjes.js';
import { PIECIES } from '../data/piecies.js';
import { getGraveyardByType, addToGraveyard } from '../engine/graveyardUtils.js';

console.log('[ABILITY] piecieEffects.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function getFirstActiveSlotIndex(player) {
	return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

function hasActiveMosjeTag(player, tag) {
	const wantedTag = String(tag).toUpperCase();
	return player.activeSlots.some(slot => {
		if (!slot || slot.isDefeated) return false;
		const mosjeDef = MOSJES.find(mosje => mosje.id === slot.cardId);
		const slotTags = Array.isArray(slot.tags) ? slot.tags : [];
		const definitionTags = Array.isArray(mosjeDef?.tags) ? mosjeDef.tags : [];
		const tags = [...slotTags, ...definitionTags];
		return tags.some(value => String(value).toUpperCase() === wantedTag);
	});
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
		// Defeat-at-0: Level 0 below 0 from a damaging effect → pending defeat
		// (swept by applyPendingDefeats in checkVictory). Ruling phase0-rulings.md:118.
		if (mosje.level === 0) { mosje.mp = 0; mosje._pendingDefeat = true; break; }
		const overflow = -mosje.mp;
		mosje.level -= 1;
		mosje.mp = 100 - overflow;
	}
	mosje.mp = Math.max(0, mosje.mp);
	mosje.mpLostThisTurn = (mosje.mpLostThisTurn || 0) + amount;
}

// U8 — Entry Protection: hostile effect damage fizzles against a freshly
// entered Mosje (until its owner's next turn starts). Use for OPPONENT-
// targeted damage only — self-effects, gambles and cost payments keep
// calling applyDamage directly (costs are never blocked, see U7).
function applyHostileDamage(mosje, amount) {
	if (!mosje) return false;
	if (mosje.entryProtected === true) {
		console.log(`[ABILITY] 🛡️ Entry protection: ${mosje.name} just entered play — ${amount} damage fizzled`);
		return false;
	}
	applyDamage(mosje, amount);
	return true;
}

// U8 — Entry Protection also blocks hostile status effects: a debuff aimed at
// a freshly entered Mosje fizzles. Use for OPPONENT-targeting pushes only —
// buffs on your own Mosjes are always allowed.
function pushHostileStatus(mosje, effect, label) {
	if (mosje.entryProtected === true) {
		console.log(`[ABILITY] 🛡️ Entry protection: ${mosje.name} just entered play — ${effect.type} fizzled`);
		return false;
	}
	mosje.statusEffects.push(effect);
	if (label) console.log(label);
	return true;
}

function applyMPGain(player, si, amount, state, playerId) {
	// Apply mpAmplifier 50% bonus if active
	let total = amount;
	if (player.mpAmplifierActive) {
		total = roundToFive(amount * 1.5);  // game rule: MP stays on the 5-grid
		player.mpAmplifierActive = false;
		console.log(`[ABILITY] MP Amplifier applied: ${amount} \u2192 ${total}`);
	}
	// MP ceiling 100 — piecie/ability gains never permanently level up (only Quests
	// do). The checkVictory sweep enforces this globally too; capping here keeps the
	// in-effect mp truthful for any effect that reads it immediately after.
	player.activeSlots[si].mp = Math.min(100, player.activeSlots[si].mp + total);
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
	// Defer to UI: player picks any active Mosje (own or opponent).
	// If Binti: +60 MP. Anyone else: -30 MP. Resolved in main.js handleActivatePiecie.
	state._varkenspootjesPending = { activatingPlayerId: playerId };
	console.log('[ABILITY] Varkenspootjes: waiting for Mosje target selection');
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

	// U8 — whole effect fizzles when the drain target just entered play.
	if (osi >= 0 && state.players[oppId].activeSlots[osi]?.entryProtected === true) {
		console.log('[ABILITY] 🛡️ Entry protection: Affoe fizzled — target just entered play');
		delete state._pendingTargets;
		return state;
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
	if (osi >= 0 && applyHostileDamage(state.players[oppId].activeSlots[osi], 25)) {
		console.log('[ABILITY] Te Hard Gaan: opponent -25 MP');
	}
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
		// U8 — whole steal fizzles (no damage, no gain) vs a protected target.
		if (state.players[oppId].activeSlots[osi].entryProtected === true) {
			console.log('[ABILITY] 🛡️ Entry protection: Momentum Diefje fizzled — target just entered play');
			return state;
		}
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

export function effect_dikke_taks(gameState, playerId) {
	const state = cloneState(gameState);
	const opponents = Object.keys(state.players).filter(id => id !== playerId);
	const damage = opponents.length >= 3 ? 40 : 35;
	for (const oppId of opponents) {
		const osi = getFirstActiveSlotIndex(state.players[oppId]);
		if (osi >= 0) applyHostileDamage(state.players[oppId].activeSlots[osi], damage);
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
		console.log('[ABILITY] Slecht Gezet: no active Place');
		return gameState;
	}
	const state = cloneState(gameState);
	const activePlayer = state.activePlayerId;
	const placeOwner = state.activePlacePlayedBy;

	if (placeOwner === activePlayer) {
		// Your own Place → return directly to hand (not via discard)
		const player = state.players[activePlayer];
		if (player) {
			if (!Array.isArray(player.hand)) player.hand = [];
			player.hand.push({ cardId: state.activePlace, type: 'PLACE' });
		}
		state.activePlace = null;
		state.activePlacePlayedBy = null;
		state.activePlaceTurnsActive = 0;
		console.log('[ABILITY] Slecht Gezet: returned own Place to hand');
		return state;
	}

	// Opponent's Place (or null owner) → destroy it (routes to owner's discard)
	let next = destroyActivePlace(state);
	next = triggerPlaceDestroyedEffects(next, activePlayer);
	console.log('[ABILITY] Slecht Gezet: opponent Place destroyed');
	return next;
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
	if (!player || player.graveyard?.length === 0) return state;
	// Retrieve top discard card to hand, mark as unplayable this turn
	const retrieved = player.graveyard.shift();
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

export function effect_loaded_dice(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const bonus = hasActiveMosjeTag(player, 'JEFFREY') ? 2 : 1;
	player.questPrepBonus = (player.questPrepBonus || 0) + bonus;
	console.log(`[ABILITY] Loaded Dice: +${bonus} to next Quest roll`);
	return state;
}

export function effect_boosterpackkie(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	let cardsDrawn = 0;
	if (player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		cardsDrawn += 1;
	}
	const roll = rollDie(6);
	if (roll >= 5 && player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		cardsDrawn += 1;
	}

	const hasCoert = hasActiveMosjeTag(player, 'COERT');
	const si = getFirstActiveSlotIndex(player);
	if (hasCoert && si >= 0) applyMPGain(player, si, 10, state, playerId);
	console.log(`[ABILITY] Boosterpackkie: drew ${cardsDrawn}, rolled ${roll}${hasCoert ? ', +10 MP (COERT)' : ''}`);
	return state;
}

export function effect_perfect_rhythm(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	player.perfectRhythmDrawNextPiecie = true;
	const hasDdrChris = player.activeSlots.some(
		slot => slot && !slot.isDefeated && slot.cardId === 'mosje_chris_ddr'
	);
	const si = getFirstActiveSlotIndex(player);
	if (hasDdrChris && si >= 0) applyMPGain(player, si, 10, state, playerId);
	console.log(`[ABILITY] Perfect Rhythm: next Piecie activation draws 1${hasDdrChris ? ', +10 MP (DDR Chris)' : ''}`);
	return state;
}

export function effect_dikke_plaat(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const bonus = hasActiveMosjeTag(player, 'DJ') ? 2 : 1;
	player.questPrepBonus = (player.questPrepBonus || 0) + bonus;
	console.log(`[ABILITY] Dikke Plaat: +${bonus} to next Quest roll`);
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
	const mosjesToRevive = getGraveyardByType(player, 'MOSJE');
	if (!player || mosjesToRevive.length === 0) {
		console.log('[ABILITY] Mosje Reborn: no defeated Mosjes in graveyard');
		return state;
	}
	const emptySlot = player.activeSlots.findIndex(s => s === null);
	if (emptySlot < 0) {
		console.log('[ABILITY] Mosje Reborn: no empty slot available');
		return state;
	}
	const reviveIdx = player.graveyard.findIndex(e => e.type === 'MOSJE');
	const [revived] = player.graveyard.splice(reviveIdx, 1);
	const mosjeDef = MOSJES.find(m => m.id === revived.cardId);
	const startMP = mosjeDef?.startMP ?? 0;
	revived.isDefeated = false;
	revived.mp = startMP + 40;
	revived.abilityUsedThisTurn = false;
	revived.immuneThisTurn = false;
	revived.mpLostThisTurn = 0;
	player.activeSlots[emptySlot] = revived;
	console.log(`[ABILITY] Mosje Reborn: revived ${revived.name} at ${revived.mp} MP (${startMP} base + 40)`);
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
	yourSlot.mp = oppSlot.mp;
	oppSlot.mp = tmp;
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

export function effect_stookerino(gameState, playerId) {
	// Needs UI: which card to discard from opponent's hand. For now: discard random.
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	if (opp.hand.length === 0) return state;
	const idx = Math.floor(Math.random() * opp.hand.length);
	const discarded = opp.hand.splice(idx, 1)[0];
	if (!Array.isArray(opp.graveyard)) opp.graveyard = [];
	const discardedId = discarded?.cardId ?? discarded;
	opp.graveyard.push({ cardId: discardedId, name: discardedId, type: 'HAND_CARD', source: 'discarded' });
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
		console.log('[ABILITY] Popo Komt: 3+ Mosjes \u2014 Place destroyed!');
		return triggerPlaceDestroyedEffects(afterDestroy, playerId);
	} else {
		console.log('[ABILITY] Popo Komt: not enough Mosjes on field');
	}
	return state;
}

export function effect_huisbaas(gameState, playerId) {
	// Return the most recently lost Place from this player's own discard pile to hand.
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (!Array.isArray(player.graveyard)) player.graveyard = [];
	const placeIndex = player.graveyard.findIndex(
		c => c?.type === 'PLACE' || (c?.cardId && String(c.cardId).startsWith('place_'))
	);
	if (placeIndex < 0) {
		console.log('[ABILITY] Huisbaas: no Place cards in graveyard');
		return state;
	}
	const [recovered] = player.graveyard.splice(placeIndex, 1);
	if (!Array.isArray(player.hand)) player.hand = [];
	player.hand.push({ cardId: recovered.cardId ?? recovered, type: 'PLACE' });
	console.log('[ABILITY] Huisbaas: recovered', recovered.cardId ?? recovered, 'from graveyard to hand');
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
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += 20;
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

	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si >= 0) {
		state._mpAdjusterPending = { playerId, slotIndex: si };
	}
	console.log('[ABILITY] MP Adjuster: value selection pending UI');
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
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const mosjeEntries = getGraveyardByType(player, 'MOSJE');
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
	// D-05: player chooses which on-field Mosje pays tribute — never an
	// automatic first-slot pick. D-06: no-op (no charge, no redirect) unless
	// a valid payer was pre-selected via the tribute-payer picker (main.js
	// stashes the choice into _pendingTargets.welloeForcePayerSlot before
	// calling activatePiecie).
	const si = state._pendingTargets?.welloeForcePayerSlot;
	if (typeof si !== 'number' || !player.activeSlots[si] || player.activeSlots[si].isDefeated) return state;
	// Pay 40 MP activation cost from the chosen active Mosje
	applyDamage(player.activeSlots[si], 40);
	// Set 3-turn damage redirect. UI picks the target opponent Mosje.
	state._welloeForceActive = { ownerId: playerId, turnsRemaining: 3, targetSlotId: null };
	console.log('[ABILITY] Welloe Force: paid 40 MP, 3-turn redirect active, target pending UI');
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
	const selected = state._pendingTargets?.own_slot_index;
	const si = Number.isInteger(selected) ? selected : getFirstActiveSlotIndex(player);
	if (si >= 0) player.activeSlots[si].mp += 25;
	if (state._pendingTargets) delete state._pendingTargets.own_slot_index;
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
	const selected = state._pendingTargets?.own_slot_index;
	const si = Number.isInteger(selected) ? selected : getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	if (state._pendingTargets) delete state._pendingTargets.own_slot_index;
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
	if (osi >= 0 && applyHostileDamage(state.players[oppId].activeSlots[osi], 30)) {
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
// PHYSICAL EQUIPMENT
// ─────────────────────────────────────────

export function effect_dumbbells(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
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

export function effect_boxing_gloves(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const physical = mosje.traits?.physical || 0;
	if (physical < 2) {
		console.log('[ABILITY] Boxing Gloves: no effect (Physical trait < 2)');
		return state;
	}
	const id = String(mosje.cardId || '').toLowerCase();
	const isGandoe = id.includes('gandoe');
	const mp = isGandoe ? 40 : 25;
	applyMPGain(player, si, mp, state, playerId);
	if (isGandoe) {
		for (const slot of player.activeSlots) {
			if (!slot || slot.isDefeated) continue;
			slot.statusEffects.push({ type: 'MP_LOSS_HALVED', value: 1, turnsLeft: 1 });
		}
		console.log(`[ABILITY] Boxing Gloves: +${mp} MP (GANDOE), MP loss halved 1 turn`);
	} else {
		console.log(`[ABILITY] Boxing Gloves: +${mp} MP (Physical ★★+)`);
	}
	return state;
}

export function effect_skipping_rope(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const isPhysical = mosje.subtype === 'FIGHTING';
	if (isPhysical) {
		player.questPrepBonus = (player.questPrepBonus || 0) + 1;
	}
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	console.log(`[ABILITY] Skipping Rope:${isPhysical ? ' +1 quest bonus,' : ''} drew 1`);
	return state;
}

export function effect_protein_shake(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	if (mosje.subtype !== 'FIGHTING') {
		console.log('[ABILITY] Protein Shake: no effect (no Physical Mosje)');
		return state;
	}
	const isBoxingRing = state.activePlace === 'place_boxing_ring';
	const mp = isBoxingRing ? 35 : 25;
	applyMPGain(player, si, mp, state, playerId);
	console.log(`[ABILITY] Protein Shake: +${mp} MP (Physical${isBoxingRing ? ', Boxing Ring bonus' : ''})`);
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
		pushHostileStatus(
			state.players[oppId].activeSlots[osi],
			{ type: 'CONTINUOUS_ASSAULT', value: -15, turnsLeft: 3 },
			'[ABILITY] Continuous Assault: -15 MP/turn for 3 turns on opponent'
		);
	}
	return state;
}

export function effect_harde_didde(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0 && applyHostileDamage(state.players[oppId].activeSlots[osi], 50)) {
		console.log('[ABILITY] Harde Didde: opponent -50 MP');
	}
	return state;
}

export function effect_mp_hemorrhage(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const osi = getFirstActiveSlotIndex(state.players[oppId]);
	if (osi >= 0) {
		pushHostileStatus(
			state.players[oppId].activeSlots[osi],
			{ type: 'HEMORRHAGE', value: -20, turnsLeft: 5 },
			'[ABILITY] MP Hemorrhage: -20 MP/turn for 5 turns'
		);
	}
	return state;
}

export function effect_klaar_met_jou(gameState, playerId) {
	let state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	let opp = state.players[oppId];
	const osi = getFirstActiveSlotIndex(opp);
	if (osi >= 0) {
		// U8 — whole effect fizzles (no damage, no discard) vs a protected target.
		if (opp.activeSlots[osi].entryProtected === true) {
			console.log('[ABILITY] 🛡️ Entry protection: Klaar met jou fizzled — target just entered play');
			return state;
		}
		applyDamage(opp.activeSlots[osi], 40);
		if (opp.hand.length > 0) {
			const [removed] = opp.hand.splice(opp.hand.length - 1, 1);
			const cardId = removed?.cardId ?? removed;
			state = addToGraveyard(state, oppId, cardId, 'discarded');
			opp = state.players[oppId];
		}
		console.log('[ABILITY] Klaar met jou: opponent -40 MP, discard 1 to graveyard');
	}
	return state;
}
