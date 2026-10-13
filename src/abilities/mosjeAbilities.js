// mosjeAbilities.js — One function per Mosje card's unique ability.
// Each function receives the game state and returns the updated state.
// Filled in Phase 4.

import { getMingPeekStack } from './getMingPeekStack.js';
import { gainMP, loseMP } from '../engine/mpManager.js';
import { markMosjeDefeated } from '../engine/victoryChecker.js';
import { applyGainToSlot } from '../engine/mp/applyGainToSlot.js';
import { applyMpLossToSlot } from '../engine/mp/applyMpLossToSlot.js';
import { isFresh } from '../engine/fresh/isFresh.js';
import { hackerSystemHack } from './mosje/hackerSystemHack.js';
import { chrisPerfectSetup } from './mosje/chrisPerfectSetup.js';
import { fpsWestGuess } from './mosje/fpsWestGuess.js';
import { tacticianMpManipulation } from './mosje/tacticianMpManipulation.js';
import { gandoeDestroyerEliminationStrike } from './mosje/gandoeDestroyerEliminationStrike.js';
import { martinDriverPitStop } from './mosje/martinDriverPitStop.js';
import { mingNaturalLuckyDraw } from './mosje/mingNaturalLuckyDraw.js';
import { mingPredictorFutureSight } from './mosje/mingPredictorFutureSight.js';
import { jeffreyGamblerHighStakes } from './mosje/jeffreyGamblerHighStakes.js';
import { youriSpeedActivate } from './mosje/youriSpeedActivate.js';
import { ronaldMastermindMasterPlan } from './mosje/ronaldMastermindMasterPlan.js';
import { tukHealingHands } from './mosje/tukHealingHands.js';
import { bintiCuttingWords } from './mosje/bintiCuttingWords.js';

console.log('[ABILITY] mosjeAbilities.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

// NOTE (U8): applyDamage here is used mostly for OWN-Mosje ability costs and
// self-gambles, which entry protection must never block (U7). Hostile
// opponent-targeting abilities enforce U8 themselves by throwing when the
// target just entered play (the throw is caught by useMosjeAbility, so the
// ability is simply unusable — no cost, no once-per-turn consumed).
// Thin wrapper over the 2.0 loss funnel (pipeline -> subtract -> track -> getemt).
// `playerId` is the OWNER of the slot being hit.
function applyDamage(state, playerId, mosje, amount, source = 'ABILITY') {
	if (!mosje || mosje.isDefeated || !(amount > 0)) return { final: 0, getemt: null };
	return applyMpLossToSlot({ state, playerId, slot: mosje, amount, source });
}

// applyGain — thin wrapper over the 2.0 gain funnel (100+ levels up, L3 caps at 95).
function applyGain(state, mosje, amount) {
	return applyGainToSlot(mosje, amount, { turnNumber: state.turnNumber });
}

// Slot of the acting Mosje (by cardId). Without an id (legacy/test callers) the only
// non-defeated Mosje is used; with several, the first plus a warning.
function getActiveSlotIndexForMosje(player, mosjeId = null) {
	const slots = player.activeSlots;
	if (mosjeId) {
		return slots.findIndex(slot => slot !== null && !slot.isDefeated && slot.cardId === mosjeId);
	}
	const alive = slots.map((s, i) => (s && !s.isDefeated ? i : -1)).filter(i => i >= 0);
	if (alive.length > 1) console.warn('[TARGET] ability called without its Mosje id');
	return alive.length ? alive[0] : -1;
}

function getOpponentId(state, playerId) {
	return Object.keys(state.players).find(id => id !== playerId) || null;
}

// DJ 80/20 — Lucky Beats is a reaction at the Quest after-roll pause (abilities/mosje/djLuckyBeats.js,
// offered by getEligibleReactions); there is no manual activation. Kept so the dispatch map resolves.
export function ability_dj_8020_lucky_beats() {
	throw new Error('Lucky Beats is used at the pause after a Quest roll');
}

// Binti — Cutting Words: see abilities/mosje/bintiCuttingWords.js (1 Energy via abilityEnergyCosts.js).
export function ability_binti_cutting_words(gameState, playerId, mosjeId) {
	return bintiCuttingWords(gameState, playerId, mosjeId);
}

// Coert Tech — Extra Resources is a draw-step option (abilities/mosje/coertTechExtraResources.js, finishDrawStep);
// there is no Activate button. Kept so a stray useMosjeAbility call is refused instead of crashing.
export function ability_coert_extra_resources() {
	throw new Error('Extra Resources is used during your draw step');
}

// ────────────────────────────────────────────────────────────────────────────────
// PHASE 4: REAL IMPLEMENTATIONS FOR ALL 33 REMAINING MOSJE ABILITIES
// ────────────────────────────────────────────────────────────────────────────────

// FIGHTING MOSJES

// 2.0: Gandoe Wizard Chaos Roll is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_gandoe_wizard_chaos_roll(gameState) {
	return gameState;
}

// Jeffrey Strongman — Brute Force is a questSuccess trigger (abilities/mosje/jeffreyBruteForce.js) plus the MP-Piecie gate
// (engine/table/piecieActivationGate.js). This manual entry is a no-op kept so the dispatch map resolves.
export function ability_jeffrey_brute_force(gameState, _playerId) {
	console.log('[ABILITY] Jeffrey Brute Force: passive auto-ability — no manual activation needed');
	return gameState;
}

// 2.0: Alyssa Bulldozer Unstoppable is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_alyssa_bulldozer_unstoppable(gameState) {
	return gameState;
}

// 2.0: Alyssa Fissa Party Power is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_alyssa_fissa_party_power(gameState) {
	return gameState;
}

// 2.0: AZN Cless Risk & Reward is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_azn_cless_risk_reward(gameState) {
	return gameState;
}

// 2.0: Michelle Tough Gamble is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_michelle_tough_gamble(gameState) {
	return gameState;
}

// 2.0: Parkour West Flow is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_parkour_west_adaptive_combat(gameState) {
	return gameState;
}

// Gandoe Destroyer — Elimination Strike: see abilities/mosje/gandoeDestroyerEliminationStrike.js (4 Energy, once per game).
export function ability_gandoe_destroyer_elimination_strike(gameState, playerId, mosjeId) {
	return gandoeDestroyerEliminationStrike(gameState, playerId, mosjeId);
}

// DIGITAL MOSJES

// Ronald Chef — Strategic Insight: pay 2 Energy, lock a card in the opponent's hand
// (chosen via the UI -> _pendingTargets.ronaldLockCardId) until this player's next
// turn. Once per turn (abilityUsedThisTurn) + a 3-turn cooldown on the slot.
export function ability_ronald_chef_strategic_insight(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const slotIndex = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('ronald_chef'));
	if (slotIndex < 0) throw new Error('Ronald Chef not on field');
	const slot = player.activeSlots[slotIndex];
	if ((slot.strategicInsightCooldown || 0) > 0) {
		throw new Error(`Strategic Insight is on cooldown (${slot.strategicInsightCooldown} turn(s) left)`);
	}
	const lockCardId = state._pendingTargets?.ronaldLockCardId;
	if (!lockCardId) throw new Error('Strategic Insight requires an opponent card to lock');
	const oppId = getOpponentId(state, playerId);
	if (!oppId) throw new Error('No opponent on field');
	const next = state;
	next.players[oppId]._lockedCard = { cardId: lockCardId, byPlayer: playerId };
	next.players[playerId].activeSlots[slotIndex].strategicInsightCooldown = 3;
	if (next._pendingTargets) delete next._pendingTargets.ronaldLockCardId;
	console.log('[ABILITY] Ronald Strategic Insight: locked', lockCardId, 'on', oppId, '(cooldown 3)');
	return next;
}

// Ming Natural — Lucky Draw: see abilities/mosje/mingNaturalLuckyDraw.js (free activation or hand, else draw + 15 MP).
export function ability_ming_natural_lucky_draw(gameState, playerId, mosjeId) {
	return mingNaturalLuckyDraw(gameState, playerId, mosjeId);
}

// Ming Predictor — Future Sight: see abilities/mosje/mingPredictorFutureSight.js (1 Energy paid inside the effect).
export function ability_ming_predictor_future_sight(gameState, playerId, mosjeId) {
	return mingPredictorFutureSight(gameState, playerId, mosjeId);
}

// Martin Historian — retrieve top card from own discard pile to hand.
export function ability_martin_historian_time_control(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.graveyard.length === 0) {
		console.log('[ABILITY] Martin Historian: discard empty');
		return state;
	}
	const retrieved = player.graveyard.shift();
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
		: getActiveSlotIndexForMosje(player, mosjeId);
	if (si < 0) return state;

	const guess = state._pendingTargets?.west_guess;
	const topCardType = state._pendingTargets?.west_top_card_type;

	if (!guess || !topCardType) {
		console.warn('[ABILITY] Senor West: missing guess or top card type — no effect');
		return state;
	}

	const isCorrect = guess === topCardType;
	if (isCorrect) {
		applyGain(state, player.activeSlots[si], 10);
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

export function ability_coert_tech_extra_resources() {
	return ability_coert_extra_resources();
}

// Hacker — System Hack: see abilities/mosje/hackerSystemHack.js (1 Energy via abilityEnergyCosts.js).
export function ability_hacker_system_hack(gameState, playerId, mosjeId) {
	return hackerSystemHack(gameState, playerId, mosjeId);
}

// Jeffrey Gambler — High Stakes: see abilities/mosje/jeffreyGamblerHighStakes.js (stake paid inside the effect).
export function ability_jeffrey_gambler_high_stakes(gameState, playerId, mosjeId) {
	return jeffreyGamblerHighStakes(gameState, playerId, mosjeId);
}

// Chris All-Rounder — Perfect Setup: see abilities/mosje/chrisPerfectSetup.js (free activation + 15 MP).
export function ability_chris_perfect_setup(gameState, playerId, mosjeId) {
	return chrisPerfectSetup(gameState, playerId, mosjeId);
}

// Youri Speedrunner — Speed Activate: see abilities/mosje/youriSpeedActivate.js (1 Energy via abilityEnergyCosts.js).
export function ability_youri_speed_activate(gameState, playerId, mosjeId) {
	return youriSpeedActivate(gameState, playerId, mosjeId);
}

// Tactician — MP Manipulation: see abilities/mosje/tacticianMpManipulation.js (2 Energy via abilityEnergyCosts.js).
export function ability_tactician_mp_manipulation(gameState, playerId) {
	return tacticianMpManipulation(gameState, playerId);
}

// Drainer (start of each opponent turn) and FPS Coert (Quest win) are registered Mosje triggers
// (abilities/mosje/drainerContinuousDrain.js, fpsCoertHeadshot.js); no manual activation.
export function ability_drainer_continuous_drain(gameState) {
	return gameState;
}
export function ability_fps_coert_headshot_precision(gameState) {
	return gameState;
}

// FPS West — Tactical Analysis: see abilities/mosje/fpsWestGuess.js (1 Energy via abilityEnergyCosts.js).
export function ability_fps_west_tactical_analysis(gameState, playerId, mosjeId) {
	return fpsWestGuess(gameState, playerId, mosjeId);
}

// ARTISTIC MOSJES

// Ronald Mastermind — Master Plan: see abilities/mosje/ronaldMastermindMasterPlan.js (2 Energy via abilityEnergyCosts.js).
export function ability_ronald_mastermind_master_plan(gameState, playerId, mosjeId) {
	return ronaldMastermindMasterPlan(gameState, playerId, mosjeId);
}

// 2.0: Jisca Perfect Combo is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_jisca_perfect_combo(gameState) {
	return gameState;
}

// Tuk Healer — Healing Hands: see abilities/mosje/tukHealingHands.js (1 Energy via abilityEnergyCosts.js).
export function ability_tuk_healer_healing_presence(gameState, playerId, mosjeId) {
	return tukHealingHands(gameState, playerId, mosjeId);
}

// Coert KasteLuck — morning luck: roll d6. Even → +15 MP.
// Coert KasteLuck — Morning Luck is now an auto-trigger at turn start (2026-07-13
// reconciliation): the real roll + same-turn-activation grant live in
// turnManager.js's startTurn() and playPiecie(). This manual entry is a no-op kept
// so useMosjeAbility does not crash if called (mirrors ability_jeffrey_brute_force).
export function ability_coert_kasteluck_morning_luck(gameState, _playerId) {
	console.log('[ABILITY] Coert KasteLuck Morning Luck: passive auto-ability — no manual activation needed');
	return gameState;
}

// Binti Creator — Quick Sketch: discard 2 FOOD Piecies from hand, then search your
// deck for any card and add it to your hand. The 2 discards and the fetched card come
// from the UI via _pendingTargets.bintiCreatorDiscard (2 cardIds) + .bintiCreatorTutor.
export function ability_binti_creator_quick_sketch(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	const discardIds = state._pendingTargets?.bintiCreatorDiscard;
	const tutorId = state._pendingTargets?.bintiCreatorTutor;
	if (!Array.isArray(discardIds) || discardIds.length < 2) {
		throw new Error('Quick Sketch requires discarding 2 FOOD Piecies');
	}
	if (!tutorId) throw new Error('Quick Sketch requires a card to fetch from your deck');
	// Pay the cost: discard 2 cards from hand (one instance each — handles duplicates).
	for (const id of discardIds.slice(0, 2)) {
		const hi = player.hand.findIndex(c => (c.cardId ?? c) === id);
		if (hi < 0) throw new Error('Quick Sketch discard not in hand');
		const [removed] = player.hand.splice(hi, 1);
		player.graveyard.push(removed);
	}
	// Tutor: pull the chosen card out of the deck into hand.
	const di = player.deck.findIndex(c => (c.cardId ?? c) === tutorId);
	if (di < 0) throw new Error('Quick Sketch card not in deck');
	const [fetched] = player.deck.splice(di, 1);
	player.hand.push(fetched);
	if (state._pendingTargets) {
		delete state._pendingTargets.bintiCreatorDiscard;
		delete state._pendingTargets.bintiCreatorTutor;
	}
	console.log('[ABILITY] Binti Creator Quick Sketch: discarded 2 FOOD, tutored', tutorId);
	return state;
}

// 2.0: Cless Teacher Teaching Moment is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_cless_teacher_teaching_moment(gameState) {
	return gameState;
}

// Martin Driver — Pit Stop: see abilities/mosje/martinDriverPitStop.js (Perfect Line, the Quest bonus, is a questSuccess trigger).
export function ability_martin_driver_perfect_line(gameState, playerId, mosjeId) {
	return martinDriverPitStop(gameState, playerId, mosjeId);
}

// Amplifier — Power Boost: pay 30 MP, arm a double-trigger so your active Mosje's next
// ability triggers twice this turn (reuses the Redbull abilityDoubleTrigger mechanic).
// Max 2 uses per game (player.amplifierUses).
export function ability_amplifier_power_boost(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');
	if ((player.amplifierUses || 0) >= 2) throw new Error('Power Boost can only be used twice per game');
	const si = player.activeSlots.findIndex(s => s && !s.isDefeated && String(s.cardId).includes('amplifier'));
	if (si < 0) throw new Error('Amplifier not on field');
	const mosje = player.activeSlots[si];
	if (mosje.mp < 30) throw new Error('Not enough MP — Power Boost costs 30 MP');
	applyDamage(state, playerId, mosje, 30);
	player.amplifierUses = (player.amplifierUses || 0) + 1;
	player.abilityDoubleTrigger = true;
	console.log('[ABILITY] Amplifier Power Boost: paid 30 MP, double-trigger armed (use', player.amplifierUses, 'of 2)');
	return state;
}

// Coert Kastelein — immovable object: this Mosje cannot lose MP this turn.
export function ability_coert_kastelein_immovable_object(gameState, playerId, mosjeId = null) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getActiveSlotIndexForMosje(player, mosjeId);
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
	const chosen = state._pendingTargets?.tukChosenCardIds; // array of up to 2 cardIds from top 5
	if (!Array.isArray(chosen) || chosen.length === 0) throw new Error('Perfect Placement requires card selection');
	// 2.0: no MP cost; 1 Energy is charged by useMosjeAbility (abilityEnergyCosts.js).
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

// 2.0: Dancing/DDR Chris Perfect Combo Chain is a trigger/passive (src/abilities/mosje/*, MOSJE_TRIGGERS). No manual ability; kept so the dispatch map resolves.
export function ability_chris_ddr_perfect_combo_chain(gameState) {
	return gameState;
}
