// mosjeAbilities.js — One function per Mosje card's unique ability.
// Each function receives the game state and returns the updated state.
// Filled in Phase 4.

import { drawCards } from '../engine/deckEngine.js';

console.log('[ABILITY] mosjeAbilities.js loaded');

function cloneState(state) {
	return JSON.parse(JSON.stringify(state));
}

function getFirstActiveSlotIndex(player) {
	return player.activeSlots.findIndex(slot => slot !== null && !slot.isDefeated);
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
export function ability_coert_extra_resources(gameState, playerId) {
	const state = cloneState(gameState);
	const player = state.players[playerId];
	if (!player) throw new Error('Player not found');

	const slotIndex = getFirstActiveSlotIndex(player);
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
