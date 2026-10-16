// utilityChainPiecies - Card List 2.0 Utility chain Piecies (Example-Deck cards).
import { cloneState } from './cloneState.js';

// Chain Reaction: arms the owner for this turn. afterPiecieEffect turns it into a free offer after the next paid
// Piecie activation (not this card's own); activatePiecie then makes one more ready Piecie free (once).
export function effect_chain_reaction(gameState, playerId) {
	const state = cloneState(gameState);
	if (state.players[playerId]) state.players[playerId].chainReactionFree = 1;
	return state;
}

// MP Amplifier: arms the owner's next MP gain this turn (applyMpAmplifier in gainMP doubles it, max +40 extra).
// Not "giving MP": Jeffrey allows it. An unused amplifier ends with the turn (expireThisTurnEffects).
export function effect_mp_amplifier(gameState, playerId) {
	const state = cloneState(gameState);
	if (state.players[playerId]) state.players[playerId].mpAmplifierThisTurn = true;
	return state;
}

// Synergy Field: Stays (data: endOfNextTurn). The effect itself is passive: gainMP asks synergyFieldBonus for
// +10 per staying copy on an ability gain. Not "giving MP" either.
export const effect_synergy_field = (gameState) => cloneState(gameState);
