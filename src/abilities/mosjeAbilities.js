// mosjeAbilities.js — One function per Mosje card's unique ability.
// Each function receives the game state and returns the updated state.
// Filled in Phase 4.

import { drawCards, rollDie } from '../engine/deckEngine.js';
import { loseMP } from '../engine/mpManager.js';

console.log('[ABILITY] mosjeAbilities.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
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

// DJ 80/20 passive: gain 10 MP at turn start.
export function ability_dj_8020_lucky_beats(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;

	const slotIndex = getFirstActiveSlotIndex(player);
	if (slotIndex < 0) return state;

	player.activeSlots[slotIndex].mp += 10;
	console.log('[ABILITY] DJ 80/20 passive applied +10 MP');
	return state;
}

// Binti active: discard 1 card from hand, opponent loses 10 MP and discards 1 if possible.
export function ability_binti_cutting_words(gameState, playerId, discardedCardId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');

	const handIndex = player.hand.findIndex(card => card.cardId === discardedCardId || card === discardedCardId);
	if (handIndex < 0) throw new Error('Binti ability requires discarding a card from hand');
	player.hand.splice(handIndex, 1);

	const opponentId = getOpponentId(state, playerId);
	if (!opponentId) return state;
	const opponent = state.players[opponentId];

	const oppSlotIndex = getFirstActiveSlotIndex(opponent);
	if (oppSlotIndex >= 0) {
		opponent.activeSlots[oppSlotIndex].mp -= 10;
	}

	if (opponent.hand.length > 0) {
		const discarded = opponent.hand.shift();
		opponent.discard.unshift(discarded);
	}

	console.log('[ABILITY] Binti Cutting Words resolved');
	return state;
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
	mosje.mp -= 10;

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

// Jeffrey Strongman — all Quests give +10 MP bonus; this Mosje cannot use FOOD or RESTORE Piecies.
export function ability_jeffrey_brute_force(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	player.questBonusMP = (player.questBonusMP || 0) + 10;
	player.jeffreyFoodRestrictActive = true;
	console.log('[ABILITY] Jeffrey Brute Force: +10 questBonusMP, FOOD/RESTORE Piecies blocked');
	return state;
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
		player.activeSlots[si].mp -= 15;
		console.log(`[ABILITY] AZN Cless: rolled ${roll} (odd) → -15 MP`);
	}
	return state;
}

// Michelle — tough gamble: roll d6. 4+ → +40 MP. Below 4 → nothing.
export function ability_michelle_tough_gamble(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const si = getFirstActiveSlotIndex(player);
	if (si < 0) return state;
	const roll = rollDie(6);
	if (roll >= 4) {
		player.activeSlots[si].mp += 40;
		console.log(`[ABILITY] Michelle: rolled ${roll} → +40 MP`);
	} else {
		console.log(`[ABILITY] Michelle: rolled ${roll} → no effect`);
	}
	return state;
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
	const oppId = getOpponentId(state, playerId);
	if (!oppId) return state;
	const opp = state.players[oppId];
	const osi = getFirstActiveSlotIndex(opp);
	if (osi >= 0) {
		opp.activeSlots[osi].mp -= 45;
		console.log('[ABILITY] Gandoe Destroyer: opponent -45 MP');
	}
	return state;
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

// Ming Predictor — peek top 2 of own deck. For now: just log.
export function ability_ming_predictor_future_sight(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player || player.deck.length === 0) return state;
	const peeked = player.deck.slice(0, Math.min(2, player.deck.length)).map(c => c.cardId);
	state._mingPredictorPeek = { playerId, cards: peeked };
	console.log('[ABILITY] Ming Predictor: peeked own top 2:', peeked);
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
	mosje.mp -= 30;
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
	high.mp -= transfer;
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
		opp.activeSlots[osi].mp -= 25;
		console.log('[ABILITY] FPS Coert: headshot! opponent -25 MP');
	}
	return state;
}

// FPS West — tactical: draw 1 card, set opponent-peek flag.
export function ability_fps_west_tactical_analysis(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	if (player.deck.length > 0) player.hand.push(player.deck.shift());
	player.opponentHandPeeked = true;
	console.log('[ABILITY] FPS West: drew 1 card + opponent hand peek active');
	return state;
}

// ARTISTIC MOSJES

// Ronald Mastermind — look at top 3 of shared Quest deck; optionally rotate chosen card to top.
// Two-call pattern:
//   Call 1: no _pendingTargets.masterPlanChosenIndex → peek only, deck unchanged
//   Call 2: _pendingTargets.masterPlanChosenIndex set (0/1/2) → rotate that card to position 0
export function ability_ronald_mastermind_master_plan(gameState, playerId) {
	const state = cloneState(gameState);
	const top3 = state.sharedGeneralQuestDeck.slice(0, 3).map(c => c.cardId);
	state._masterPlanPeek = top3;
	console.log('[ABILITY] Ronald Mastermind: quest deck top 3:', top3);

	const chosenIndex = state._pendingTargets?.masterPlanChosenIndex;
	if (typeof chosenIndex === 'number' && chosenIndex >= 0 && chosenIndex <= 2) {
		const deck = state.sharedGeneralQuestDeck;
		if (chosenIndex < deck.length) {
			const [chosen] = deck.splice(chosenIndex, 1);
			deck.unshift(chosen);
			console.log('[ABILITY] Ronald Mastermind: rotated card at index', chosenIndex, 'to top:', chosen.cardId);
		}
		delete state._pendingTargets.masterPlanChosenIndex;
	}
	return state;
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

// Tuk Architect — reorder top 3 of own deck.
// Two-call pattern:
//   Call 1: no orderedCardIds → peeks top 3, stores _architectPeek, deck unchanged
//   Call 2: orderedCardIds provided → reorders deck top 3 to match
export function ability_tuk_architect_perfect_placement(gameState, playerId, orderedCardIds = null) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) return state;
	const top3 = player.deck.slice(0, 3);
	if (top3.length === 0) return state;

	if (Array.isArray(orderedCardIds) && orderedCardIds.length > 0) {
		const rest = player.deck.slice(top3.length);
		const reordered = orderedCardIds
			.map(id => top3.find(c => c.cardId === id))
			.filter(Boolean);
		const mentioned = new Set(orderedCardIds);
		const leftovers = top3.filter(c => !mentioned.has(c.cardId));
		player.deck = [...reordered, ...leftovers, ...rest];
		console.log('[ABILITY] Tuk Architect: reordered top 3 →', player.deck.slice(0, 3).map(c => c.cardId));
	} else {
		state._architectPeek = { playerId, cards: top3.map(c => c.cardId) };
		console.log('[ABILITY] Tuk Architect: peeked top 3 of own deck:', state._architectPeek.cards);
	}
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
