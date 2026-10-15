// applyMomentumBoostWin - Momentum Boost: a Mosje that was boosted this turn gains 10 MP more when it wins a Quest.
// The flag (slot.momentumBoostWin) is used once and expires at the end of the turn (expireThisTurnEffects).
import { gainMP } from '../mpManager.js';

export function applyMomentumBoostWin(state, playerId, slotIndex) {
	const slot = state.players[playerId]?.activeSlots?.[slotIndex];
	if (!slot?.momentumBoostWin) return state;
	delete slot.momentumBoostWin;
	return gainMP(state, playerId, slotIndex, 10, 'PIECIE');
}
