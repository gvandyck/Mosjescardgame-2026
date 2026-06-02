// mosjeAbilities.js — One function per Mosje card's unique ability.
// Each function receives the game state and returns the updated state.
// Filled in Phase 4.

import { drawCards, rollDie } from '../engine/deckEngine.js';
import { gainMP, loseMP } from '../engine/mpManager.js';
import { markMosjeDefeated } from '../engine/victoryChecker.js';
import * as piecieEffects from './piecieEffects.js';
import { PIECIES } from '../data/piecies.js';

console.log('[ABILITY] mosjeAbilities.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

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

function getFirstActiveSlotIndex(player) {
	return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
}

function getActiveSlotIndexForMosje(player, preferredCardId = null) {
	if (preferredCardId) {
		const explicitIndex = player.activeSlots.findIndex(
			slot => slot !== null && !slot.isDefeated && slot.cardId === preferredCardId
		);
		if (explicitIndex >= 0) return explicitIndex;
	}
	return getFirstActiveSlotIndex(player);
}

function getOpponentId(state, playerId) {
	return Object.keys(state.players).find(id => id !== playerId) || null;
}

// DJ 80/20 passive: gain 10 MP at turn start, +2 to next Quest roll this turn.
export function ability_dj_8020_lucky_beats(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = getFirstActiveSlotIndex(player);
	if (slotIndex < 0) return state;

	player.activeSlots[slotIndex].mp += 10;
	// BUG-05: DJ Lucky Mixer — add +2 to next Quest roll this turn.
	// questPrepBonus is consumed at quest resolution in main.js and reset to 0 at endTurn.
	player.questPrepBonus = (player.questPrepBonus || 0) + 2;
	console.log('[ABILITY] DJ 80/20 passive applied +10 MP and +2 Quest dice modifier');
	return state;
}

// Binti active: discard 1 card from hand, opponent loses 10 MP and discards 1 if possible.
export function ability_binti_cutting_words(gameState, playerId, discardedCardId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');

	// Always read from _pendingTargets.binti_discard (set by UI pre-pick or bot driver).
	// discardedCardId arg is the mosjeId passed by useMosjeAbility — not a card to discard.
	const cardId = state._pendingTargets?.binti_discard;
	if (state._pendingTargets?.binti_discard) delete state._pendingTargets.binti_discard;

	const handIndex = player.hand.findIndex(card => (card.cardId ?? card) === cardId);
	if (handIndex < 0) throw new Error('Binti ability requires discarding a card from hand');
	player.hand.splice(handIndex, 1);

	const opponentId = getOpponentId(state, playerId);
	if (!opponentId) return state;
	const opponent = state.players[opponentId];

	const oppSlotIndex = getFirstActiveSlotIndex(opponent);
	let finalState = state;
	if (oppSlotIndex >= 0) {
		finalState = loseMP(state, opponentId, oppSlotIndex, 10, 'ABILITY');
		console.log('[ABILITY] Binti Cutting Words: opponent loses 10 MP');
	}

	if (finalState.players[opponentId].hand.length > 0) {
		const discarded = finalState.players[opponentId].hand.shift();
		finalState.players[opponentId].discard.unshift(discarded);
	}

	console.log('[ABILITY] Binti Cutting Words resolved');
	return finalState;
}

// Coert active: pay 10 MP to draw 1 card.
export function ability_coert_extra_resources(gameState, playerId, sourceMosjeId = null) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');

	const slotIndex = getActiveSlotIndexForMosje(player, sourceMosjeId);
	if (slotIndex < 0) throw new Error('No active Mosje for Coert ability');

	const mosje = player.activeSlots[slotIndex];
	if (mosje.mp < 10) throw new Error('Not enough MP for Coert ability');
	applyDamage(mosje, 10);

	const { drawn, remaining } = drawCards(player.deck, 1);
	player.deck = remaining;
	if (drawn.length > 0) player.hand.push(drawn[0]);

	console.log('[ABILITY] Coert Extra Resources resolved');
	return state;
}

// ────────────────────────────────────────────────────────────────────────────────
// PHASE 4: REAL IMPLEMENTATIONS FOR ALL 33 REMAINING MOSJE ABILITIES
// ────────────────────────────────────────────────────────────────────────────────

// FIGHTING MOSJES

// Gandoe Wizard — roll d6: 1-2 lose 10 MP, 3-4 gain 20 MP, 5 gain 30 MP, 6 gain 50 MP.
export function ability_gandoe_wizard_chaos_roll(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	let delta = 0;
	if (roll <= 2) delta = -10;
	else if (roll <= 4) delta = 20;
	else if (roll === 5) delta = 30;
	else delta = 50;
	player.activeSlots[si].mp += delta;
	console.log(`[ABILITY] Gandoe Wizard: rolled ${roll} → ${delta > 0 ? '+' : ''}${delta} MP`);
	return state;
}

// Jeffrey Strongman — Brute Force is a passive auto-ability (see questLogic.js).
// +10 MP per quest fires in applyMosjeFieldEffectsOnQuest.
// FOOD/RESTORE block fires in playPiecie (turnManager.js) whenever Jeffrey is on field.
// This manual entry is a no-op kept so useMosjeAbility does not crash if called.
export function ability_jeffrey_brute_force(gameState, _playerId) {
	console.log('[ABILITY] Jeffrey Brute Force: passive auto-ability — no manual activation needed');
	return gameState;
}

// Alyssa Bulldozer — gains 5 MP for every 10 MP she lost this turn (comeback).
export function ability_alyssa_bulldozer_unstoppable(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const lost = mosje.mpLostThisTurn || 0;
	const bonus = Math.floor(lost / 10) * 5;
	if (bonus > 0) mosje.mp += bonus;
	console.log(`[ABILITY] Alyssa Bulldozer: ${lost} MP lost this turn → +${bonus} comeback MP`);
	return state;
}

// Alyssa Fissa — gain 5 MP per card in hand.
export function ability_alyssa_fissa_party_power(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const gain = player.hand.length * 5;
	player.activeSlots[si].mp += gain;
	console.log(`[ABILITY] Alyssa Fissa: ${player.hand.length} cards in hand → +${gain} MP`);
	return state;
}

// AZN Cless — risk/reward: roll d6. Even → +25 MP. Odd → -15 MP.
export function ability_azn_cless_risk_reward(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll % 2 === 0) {
		player.activeSlots[si].mp += 25;
		console.log(`[ABILITY] AZN Cless: rolled ${roll} (even) → +25 MP`);
	} else {
		applyDamage(player.activeSlots[si], 15);
		console.log(`[ABILITY] AZN Cless: rolled ${roll} (odd) → -15 MP`);
	}
	return state;
}

// Michelle — Tough Gamble fires automatically after each quest (see questLogic.js).
// This manual-ability entry is kept so useMosjeAbility does not crash if called,
// but it does nothing — the real logic lives in applyMosjeFieldEffectsOnQuest.
export function ability_michelle_tough_gamble(gameState, _playerId) {
	console.log('[ABILITY] Michelle Tough Gamble: auto-ability — fires after quest, not manually');
	return gameState;
}

// Parkour West — adaptive: if Mosje lost MP last turn, gain 20 MP. Otherwise gain 10 MP.
export function ability_parkour_west_adaptive_combat(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const gain = (mosje.mpLostThisTurn || 0) > 0 ? 20 : 10;
	mosje.mp += gain;
	console.log(`[ABILITY] Parkour West: adaptive +${gain} MP`);
	return state;
}

// Gandoe Destroyer — elimination strike: deal 45 MP damage to opponent.
export function ability_gandoe_destroyer_elimination_strike(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');

	// Find Gandoe's slot
	const gandoeSlotIndex = player.activeSlots.findIndex(
		s => s && !s.isDefeated && String(s.cardId).includes('gandoe_destroyer')
	);
	if (gandoeSlotIndex < 0) throw new Error('Gandoe not on field');
	const gandoeSlot = player.activeSlots[gandoeSlotIndex];

	// Once per game guard
	if (gandoeSlot.eliminationStrikeUsed) {
		throw new Error('Elimination Strike already used this game');
	}

	// MP cost check
	if (gandoeSlot.mp < 80) {
		throw new Error('Not enough MP — Elimination Strike costs 80 MP');
	}

	// Deduct 80 MP
	gandoeSlot.mp -= 80;

	// Find opponent's lowest-level active Mosje (tiebreak: lowest MP)
	const oppId = getOpponentId(state, playerId);
	if (!oppId) throw new Error('No opponent found');
	const opp = state.players[oppId];
	let targetIndex = -1;
	let lowestLevel = Infinity;
	let lowestMP = Infinity;
	opp.activeSlots.forEach((slot, idx) => {
		if (!slot || slot.isDefeated) return;
		if (slot.level < lowestLevel || (slot.level === lowestLevel && slot.mp < lowestMP)) {
			lowestLevel = slot.level;
			lowestMP = slot.mp;
			targetIndex = idx;
		}
	});
	if (targetIndex < 0) throw new Error('No opponent Mosje to target');

	// Mark once-per-game before calling markMosjeDefeated (which clones state internally)
	gandoeSlot.eliminationStrikeUsed = true;

	// Send target to Welloe pile — respects WELLOE_SHIELD and Not Today!
	const finalState = markMosjeDefeated(state, oppId, targetIndex);
	console.log(`[ABILITY] Gandoe Elimination Strike: ${opp.activeSlots[targetIndex]?.name} sent to Welloe`);
	return finalState;
}

// DIGITAL MOSJES

// Ronald Chef — strategic insight: peek opponent top 2 deck cards.
// Sets _ronaldPeek (card IDs), _ronaldPeekPlayerId, and _ronaldPeekTimestamp for UI consumption.
export function ability_ronald_chef_strategic_insight(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	const peeked = opp.deck.slice(0, 2).map(c => c.cardId);
	state._ronaldPeek = peeked;
	// DEFERRED (STUB-16): _ronaldPeek contains the peeked card IDs but UI does not render them.
	// Blocking primitive: a "peek reveal" modal showing opponent deck top 2 card names.
	// Deferred to: UI phase (peek/reveal UI primitive).
	state._ronaldPeekPlayerId = playerId;
	state._ronaldPeekTimestamp = Date.now();
	console.log('[ABILITY] Ronald Chef: peeked opponent top 2:', peeked);
	return state;
}

// Ming Natural — draw 1 card.
export function ability_ming_natural_lucky_draw(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		console.log('[ABILITY] Ming Natural: drew 1 card');
	}
	return state;
}

// Ming Predictor — Future Sight: pay 10 MP, look at the top shared General Quest
// card and optionally move it to the bottom (decision comes from the UI via
// _pendingTargets.mingSendToBottom). Once per turn (abilityUsedThisTurn handles that).
export function ability_ming_predictor_future_sight(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const slotIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('ming'));
	if (slotIndex < 0) throw new Error('Ming not on field');
	if (player.activeSlots[slotIndex].mp < 10) throw new Error('Not enough MP — Future Sight costs 10 MP');
	player.activeSlots[slotIndex].mp -= 10;
	const deck = state.sharedGeneralQuestDeck || [];
	if (deck.length === 0) { console.log('[ABILITY] Ming: quest deck empty'); return state; }
	// Move-to-bottom decision comes from _pendingTargets.mingSendToBottom (set by UI)
	if (state._pendingTargets?.mingSendToBottom === true) {
		const [top] = deck.splice(0, 1);
		deck.push(top);
		console.log('[ABILITY] Ming Future Sight: top quest sent to bottom');
	}
	if (state._pendingTargets) delete state._pendingTargets.mingSendToBottom;
	return state;
}

// Martin Historian — retrieve top card from own discard pile to hand.
export function ability_martin_historian_time_control(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.discard.length === 0) {
		console.log('[ABILITY] Martin Historian: discard empty');
		return state;
	}
	const retrieved = player.discard.shift();
	player.hand.push(retrieved);
	console.log('[ABILITY] Martin Historian: retrieved', retrieved.cardId, 'from discard');
	return state;
}

// Martin Senor West — Tactical Calculated Guess.
// Expects state._pendingTargets.west_guess (card type string) and
// state._pendingTargets.west_top_card_type (type of the top deck card).
// Correct guess → draw 2 cards + gain 10 MP. Wrong → lose 10 MP.
export function ability_martin_senor_west_calculated_guess(gameState, playerId, mosjeId) {
	let state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const westIds = new Set(['mosje_martin_senor_west']);
	const si = mosjeId && westIds.has(mosjeId)
		? player.activeSlots.findIndex(s => s && s.cardId === mosjeId && !s.isDefeated)
		: getFirstActiveSlotIndex(player);
	if (si < 0) return state;

	const guess = state._pendingTargets?.west_guess;
	const topCardType = state._pendingTargets?.west_top_card_type;

	if (!guess || !topCardType) {
		console.warn('[ABILITY] Senor West: missing guess or top card type — no effect');
		return state;
	}

	const isCorrect = guess === topCardType;
	if (isCorrect) {
		player.activeSlots[si].mp += 10;
		const drawn = player.deck.splice(0, 2);
		player.hand.push(...drawn);
		console.log(`[ABILITY] Senor West: correct guess (${guess}) → +10 MP, drew ${drawn.length} card(s)`);
	} else {
		state = loseMP(state, playerId, si, 10, 'ABILITY');
		console.log(`[ABILITY] Senor West: wrong guess (${guess}, was ${topCardType}) → -10 MP via loseMP`);
	}
	return state;
}

// West (legacy alias) — delegates to the full implementation.
export function ability_west_calculated_guess(gameState, playerId, mosjeId) {
	return ability_martin_senor_west_calculated_guess(gameState, playerId, mosjeId);
}

// Coert Tech — alias of coert_extra_resources: pay 10 MP, draw 1 card.
export function ability_coert_tech_extra_resources(gameState, playerId, sourceMosjeId = null) {
	return ability_coert_extra_resources(gameState, playerId, sourceMosjeId);
}

// Hacker — system hack: forces opponent to reveal top 1 card from deck (move to their hand; logged).
export function ability_hacker_system_hack(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	if (opp.deck.length === 0) return state;
	const exposed = opp.deck.shift();
	opp.hand.unshift(exposed);
	state._hackerExposed = exposed.cardId;
	console.log('[ABILITY] Hacker: exposed + forced into opponent hand:', exposed.cardId);
	return state;
}

// Jeffrey Gambler — bet 30 MP: roll d6. 4+ → gain 60 MP (net +30). Below 4 → lose 30 MP.
export function ability_jeffrey_gambler_high_stakes(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	if (mosje.mp < 30) {
		console.log('[ABILITY] Jeffrey Gambler: not enough MP to bet (need 30)');
		return state;
	}
	applyDamage(mosje, 30);
	const roll = rollDie(6);
	if (roll >= 4) {
		mosje.mp += 60;
		console.log(`[ABILITY] Jeffrey Gambler: rolled ${roll} (4+) → bet paid! Net +30 MP`);
	} else {
		console.log(`[ABILITY] Jeffrey Gambler: rolled ${roll} (miss) → lost the bet`);
	}
	return state;
}

// Chris All-Rounder — set flag to allow playing one Piecie instantly from hand this turn.
export function ability_chris_perfect_setup(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.instantPiecieThisTurn = true;
	console.log('[ABILITY] Chris: next Piecie played this turn activates instantly');
	return state;
}

// Youri Speedrunner — draw 1 card; that card may be played instantly this turn.
export function ability_youri_speed_activate(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		player.instantPiecieThisTurn = true;
		console.log('[ABILITY] Youri: drew 1 card + instant piecie flag set');
	}
	return state;
}

// Tactician — transfer up to 20 MP from slot 1 to slot 0 (or vice versa, picks the lower-MP slot).
export function ability_tactician_mp_manipulation(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const slots = player.activeSlots.filter(s => s && !s.isDefeated);
	if (slots.length < 2) {
		console.log('[ABILITY] Tactician: need 2 Mosjes on field');
		return state;
	}
	const [high, low] = slots[0].mp >= slots[1].mp ? [slots[0], slots[1]] : [slots[1], slots[0]];
	const transfer = Math.min(20, high.mp);
	applyDamage(high, transfer);
	low.mp += transfer;
	console.log(`[ABILITY] Tactician: transferred ${transfer} MP from ${high.name} → ${low.name}`);
	return state;
}

// Drainer — add continuous drain status: opponent loses 5 MP per turn for 3 turns.
export function ability_drainer_continuous_drain(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	const osi = getFirstActiveSlotIndex(opp);
	if (osi < 0) return state;
	opp.activeSlots[osi].statusEffects.push({ type: 'DRAIN', value: -5, turnsLeft: 3 });
	console.log('[ABILITY] Drainer: -5 MP/turn for 3 turns applied to opponent');
	return state;
}

// FPS Coert — headshot: opponent loses 25 MP.
export function ability_fps_coert_headshot_precision(gameState, playerId) {
	const state = cloneState(gameState);
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	const osi = getFirstActiveSlotIndex(opp);
	if (osi >= 0) {
		applyDamage(opp.activeSlots[osi], 25);
		console.log('[ABILITY] FPS Coert: headshot! opponent -25 MP');
	}
	return state;
}

// FPS West — Tactical Analysis: guess a card type in the opponent's hand.
// The UI (main.js) runs the pick/guess/reveal flow and passes the outcome via
// _pendingTargets.fpsWestGuessCorrect. Correct: +70 MP. Wrong: -20 MP.
export function ability_fps_west_tactical_analysis(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const slotIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('fps_west'));
	if (slotIndex < 0) throw new Error('FPS West not on field');
	const correct = state._pendingTargets?.fpsWestGuessCorrect;
	if (correct === undefined) throw new Error('Tactical Analysis requires a guess');
	let next = correct === true
		? gainMP(state, playerId, slotIndex, 70, 'FPS_WEST_GUESS')
		: loseMP(state, playerId, slotIndex, 20, 'FPS_WEST_GUESS');
	if (next._pendingTargets) delete next._pendingTargets.fpsWestGuessCorrect;
	console.log('[ABILITY] FPS West Tactical Analysis:', correct ? '+70 MP (correct)' : '-20 MP (wrong)');
	return next;
}

// ARTISTIC MOSJES

// Ronald Mastermind — Master Plan: once per game, activate any Piecie directly
// from your discard for free and resolve it immediately. The chosen Piecie comes
// from the UI via _pendingTargets.masterPlanCardId. If the Piecie persists until
// end of turn it stays on the field; otherwise it returns to discard.
export function ability_ronald_mastermind_master_plan(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const slotIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('ronald'));
	if (slotIndex < 0) throw new Error('Ronald not on field');
	if (player.activeSlots[slotIndex].masterPlanUsed) throw new Error('Master Plan already used this game');
	const chosenCardId = state._pendingTargets?.masterPlanCardId;
	if (!chosenCardId) throw new Error('Master Plan requires a Piecie selection from discard');
	// Pull the chosen Piecie out of discard
	const di = player.discard.findIndex(c => (c.cardId ?? c) === chosenCardId);
	if (di < 0) throw new Error('Chosen Piecie not in discard');
	player.discard.splice(di, 1);
	// Run its effect for free
	const def = PIECIES.find(p => p.id === chosenCardId);
	let next = state;
	if (def?.effectId && typeof piecieEffects[def.effectId] === 'function') {
		next = piecieEffects[def.effectId](state, playerId);
	}
	// Persist on field or send to discard
	const np = next.players[playerId];
	if (def?.persistUntilEndOfTurn) {
		const empty = np.piecieSlots.findIndex(s => s === null);
		if (empty >= 0) np.piecieSlots[empty] = { cardId: chosenCardId, type: 'PIECIE', faceDown: false, activated: true, persistUntilEoT: true, playedOnTurn: next.turnNumber };
		else np.discard.unshift({ cardId: chosenCardId });
	} else {
		np.discard.unshift({ cardId: chosenCardId });
	}
	np.activeSlots[slotIndex].masterPlanUsed = true;
	if (next._pendingTargets) delete next._pendingTargets.masterPlanCardId;
	console.log('[ABILITY] Ronald Master Plan: played', chosenCardId, 'free from discard');
	return next;
}

// Jisca — perfect combo: if last card played was a Piecie, gain 20 MP.
export function ability_jisca_perfect_combo(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	if (player.lastCardPlayedType === 'PIECIE' || player.lastCardPlayedType === 'SNELLE_PIECIE') {
		player.activeSlots[si].mp += 20;
		console.log('[ABILITY] Jisca: combo bonus! +20 MP');
	} else {
		console.log('[ABILITY] Jisca: no Piecie last played — no bonus');
	}
	return state;
}

// Tuk Healer — all active (non-defeated) Mosjes on your side gain 15 MP.
export function ability_tuk_healer_healing_presence(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (slot && !slot.isDefeated) slot.mp += 15;
	}
	console.log('[ABILITY] Tuk Healer: all Mosjes +15 MP');
	return state;
}

// Coert KasteLuck — morning luck: roll d6. Even → +15 MP.
export function ability_coert_kasteluck_morning_luck(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll % 2 === 0) {
		player.activeSlots[si].mp += 15;
		console.log(`[ABILITY] KasteLuck: rolled ${roll} (lucky!) → +15 MP`);
	} else {
		console.log(`[ABILITY] KasteLuck: rolled ${roll} (no luck today)`);
	}
	return state;
}

// Binti Creator — quick sketch: draw 1 card.
export function ability_binti_creator_quick_sketch(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (player.deck.length > 0) {
		player.hand.push(player.deck.shift());
		console.log('[ABILITY] Binti Creator: drew 1 card');
	}
	return state;
}

// Cless Teacher — teaching moment: next Quest roll +3 bonus.
export function ability_cless_teacher_teaching_moment(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.questPrepBonus = (player.questPrepBonus || 0) + 3;
	console.log('[ABILITY] Cless Teacher: +3 to next Quest roll');
	return state;
}

// Martin Driver — level-scaled MP: L0 → 15 MP, L1 → 25 MP, L2 → 35 MP.
export function ability_martin_driver_perfect_line(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const mosje = player.activeSlots[si];
	const gain = [15, 25, 35][mosje.level] ?? 35;
	mosje.mp += gain;
	console.log(`[ABILITY] Martin Driver: level ${mosje.level} → +${gain} MP`);
	return state;
}

// Amplifier — power boost: all your Mosjes gain 10 MP.
export function ability_amplifier_power_boost(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	for (const slot of player.activeSlots) {
		if (slot && !slot.isDefeated) slot.mp += 10;
	}
	console.log('[ABILITY] Amplifier: all Mosjes +10 MP');
	return state;
}

// Coert Kastelein — immovable object: this Mosje cannot lose MP this turn.
export function ability_coert_kastelein_immovable_object(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	player.activeSlots[si].immuneThisTurn = true;
	console.log('[ABILITY] Coert Kastelein: immune to MP loss this turn');
	return state;
}

// Tuk Architect — Perfect Placement: pay 15 MP, look at the top 5 cards of your
// deck, take 2 into your hand, and send the other 3 to the bottom. The 2 chosen
// cardIds come from the UI via _pendingTargets.tukChosenCardIds. No face-down placement.
export function ability_tuk_architect_perfect_placement(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const slotIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('tuk'));
	if (slotIndex < 0) throw new Error('Tuk not on field');
	if (player.activeSlots[slotIndex].mp < 15) throw new Error('Not enough MP — Perfect Placement costs 15 MP');
	const chosen = state._pendingTargets?.tukChosenCardIds; // array of up to 2 cardIds from top 5
	if (!Array.isArray(chosen) || chosen.length === 0) throw new Error('Perfect Placement requires card selection');
	player.activeSlots[slotIndex].mp -= 15;
	const top5 = player.deck.slice(0, 5);
	const rest = player.deck.slice(5);
	const taken = [];
	const bottomed = [];
	for (const c of top5) {
		if (taken.length < 2 && chosen.includes(c.cardId)) taken.push(c);
		else bottomed.push(c);
	}
	player.hand.push(...taken);
	player.deck = [...rest, ...bottomed];
	if (state._pendingTargets) delete state._pendingTargets.tukChosenCardIds;
	console.log('[ABILITY] Tuk Perfect Placement: took', taken.map(c => c.cardId), 'bottomed', bottomed.map(c => c.cardId));
	return state;
}

// Chris DDR — perfect combo chain: gain 5 MP per Piecie played this turn.
export function ability_chris_ddr_perfect_combo_chain(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const count = player.pieciesPlayedThisTurn || 0;
	const gain = count * 5;
	if (gain > 0) player.activeSlots[si].mp += gain;
	console.log(`[ABILITY] Chris DDR: ${count} Piecies played → +${gain} MP`);
	return state;
}
