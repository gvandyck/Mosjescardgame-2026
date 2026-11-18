// attachedPower - shared by Koksmes and Rugbybal: Power tied to the attachment (whileAttached), gone when the card leaves.
import { cloneState } from '../cloneState.js';
import { addTimedEffect } from '../../../engine/durations/addTimedEffect.js';
import { DURATIONS } from '../../../engine/durations/durationKinds.js';

export function attachedPower(gameState, playerId, ctx, cardId, amountFor) {
	const state = cloneState(gameState);
	const slot = state.players[playerId].activeSlots[ctx?.attachedTo];
	if (!slot || slot.isDefeated) return state;
	addTimedEffect(state, {
		target: { playerId, slotIndex: ctx.attachedTo, cardId: slot.cardId },
		kind: 'power', amount: amountFor(slot), duration: DURATIONS.WHILE_ATTACHED, ownerId: playerId, sourceCardId: cardId, tie: cardId,
	});
	return state;
}
