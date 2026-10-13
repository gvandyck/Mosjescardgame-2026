// Ming, The Predictor — Future Sight: once per turn, look at the top card of one Quest stack (the player's choice);
// you may pay 1 Energy to put it on the bottom of that stack. The Energy is paid INSIDE the effect (charged 0 up
// front, ABILITY_IN_EFFECT_ENERGY): if the player says yes but cannot pay, the card simply stays.
// Inputs: _pendingTargets.stack_id (a Quest stack id with cards left) and .bottom (true = put it on the bottom).
import { canPay } from '../../engine/energy/canPay.js';
import { payEnergy } from '../../engine/energy/payEnergy.js';
import { getMingPeekStack } from '../getMingPeekStack.js';

export function mingPredictorFutureSight(gameState, playerId, mosjeId = 'mosje_ming_predictor') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	if (!player?.activeSlots.some(s => s && !s.isDefeated && s.cardId === mosjeId)) throw new Error('Ming, The Predictor is not on the field');
	const stackId = getMingPeekStack(state, state._pendingTargets?.stack_id);
	if (!stackId) throw new Error('Future Sight: choose a Quest stack that still has cards');
	const wantsBottom = state._pendingTargets?.bottom === true;
	if (state._pendingTargets) { delete state._pendingTargets.stack_id; delete state._pendingTargets.bottom; }
	if (wantsBottom && canPay(player, 1)) {
		payEnergy(state, playerId, 1);
		const deck = state.questStacks[stackId].deck;
		deck.push(deck.shift());
	}
	return { state, success: true };
}
