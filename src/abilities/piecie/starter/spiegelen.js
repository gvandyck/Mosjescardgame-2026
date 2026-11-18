// Spiegelen (data id piecie_eendjes_voeren): "Target 1 opponent Mosje. One of your Mosjes copies its Power this turn."
// The own Mosje's Power this turn becomes the target's current Power (boosts included): the difference is added as a
// this-turn boost (it may be negative). Later boosts add on top. No MP is gained.
import { cloneState } from '../cloneState.js';
import { addPowerThisTurn } from '../addPowerThisTurn.js';
import { resolvePiecieOppSlot } from '../resolvePiecieOppSlot.js';
import { resolvePiecieOwnSlot } from '../resolvePiecieOwnSlot.js';
import { getPower } from '../../../engine/mp/getPower.js';

export function effect_eendjes_voeren(gameState, playerId) {
	const state = cloneState(gameState);
	const { oppId, slotIndex } = resolvePiecieOppSlot(state, playerId, 'piecie_eendjes_voeren');
	if (slotIndex < 0) return state;
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_eendjes_voeren');
	if (si < 0) return state;
	const mine = state.players[playerId].activeSlots[si];
	const theirs = state.players[oppId].activeSlots[slotIndex];
	const diff = getPower(theirs, state, oppId) - getPower(mine, state, playerId);
	addPowerThisTurn(state, playerId, si, diff);
	return state;
}
