// powerStep - "+N Power" on the picked Mosje, this turn or until the end of the owner's next turn (D-02 durations).
import { addPowerThisTurn } from '../../../abilities/piecie/addPowerThisTurn.js';
import { addTimedEffect } from '../../durations/addTimedEffect.js';
import { DURATIONS } from '../../durations/durationKinds.js';

export const powerStep = {
	needsMosje: () => true,
	run(state, playerId, step, { cardDef, picked, amount }) {
		if (picked < 0) return state;
		const duration = step.duration || DURATIONS.THIS_TURN;
		if (duration === DURATIONS.THIS_TURN) {
			addPowerThisTurn(state, playerId, picked, amount);
			return state;
		}
		const slot = state.players[playerId].activeSlots[picked];
		const res = addTimedEffect(state, {
			target: { playerId, slotIndex: picked, cardId: slot.cardId }, kind: 'power', amount, duration, ownerId: playerId, sourceCardId: cardDef?.id ?? null,
		});
		if (!res.ok) throw new Error(`power step: ${res.error}`);
		return state;
	},
};
