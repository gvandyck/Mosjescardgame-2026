// utilityChainPiecies - Card List 2.0 Utility chain Piecies (Example-Deck cards).
import { cloneState } from './cloneState.js';

// Chain Reaction: arms the owner for this turn. afterPiecieEffect turns it into a free offer after the next paid
// Piecie activation (not this card's own); activatePiecie then makes one more ready Piecie free (once).
export function effect_chain_reaction(gameState, playerId) {
	const state = cloneState(gameState);
	if (state.players[playerId]) state.players[playerId].chainReactionFree = 1;
	return state;
}
