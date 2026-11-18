// Stookerino: "Your opponent discards 1 card of their choice. With a Binti on your field: look at their hand first."
// The opponent picks (opponentDiscardChoice); the activator sees the hand only inside the Binti check. No MP (2.1 text).
import { cloneState } from '../cloneState.js';
import { friendSlotsOnField } from '../../../engine/friends/friendSlotsOnField.js';
import { revealCards } from '../../../engine/hidden/revealCards.js';
import { opponentDiscardChoice } from '../opponentDiscardChoice.js';

export function effect_stookerino(gameState, playerId, ctx = {}) {
	const state = cloneState(gameState);
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const hand = state.players[oppId]?.hand || [];
	if (!ctx.stookSeen && hand.length && friendSlotsOnField(state, playerId, ['Binti']).length) {
		revealCards(state, playerId, 'piecie_stookerino', hand.map(c => c.cardId));
	}
	return opponentDiscardChoice(state, oppId, playerId, 'stook_discard', { stookSeen: true });
}
