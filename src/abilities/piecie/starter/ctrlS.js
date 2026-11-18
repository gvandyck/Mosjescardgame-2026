// Ctrl+S: "One of your Mosjes can't drop a level until the end of your next turn." (rules 13, D-24) A timed effect of
// kind noLevelDrop on the picked own Mosje; applyMpLossToSlot reads it, expireTimedEffects ends it.
import { cloneState } from '../cloneState.js';
import { resolvePiecieOwnSlot } from '../resolvePiecieOwnSlot.js';
import { addTimedEffect } from '../../../engine/durations/addTimedEffect.js';
import { DURATIONS } from '../../../engine/durations/durationKinds.js';

export function effect_momentum_boost(gameState, playerId) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, 'piecie_momentum_boost');
	if (si < 0) return state;
	const slot = state.players[playerId].activeSlots[si];
	addTimedEffect(state, {
		target: { playerId, slotIndex: si, cardId: slot.cardId }, kind: 'noLevelDrop', amount: 1,
		duration: DURATIONS.UNTIL_END_OF_NEXT_TURN, ownerId: playerId, sourceCardId: 'piecie_momentum_boost',
	});
	return state;
}
