// Alyssa, Fissa Fissa! — Party Power: when a Place is destroyed by a card you activated,
// this Mosje gains 20 MP (once per turn).
import { gainMP } from '../../engine/mpManager.js';

export const alyssaFissaPartyPower = {
	mosjeId: 'mosje_alyssa_fissa',
	run(state, ctx) {
		const slot = state.players[ctx.ownerId].activeSlots[ctx.holderSlotIndex];
		if (slot.partyPowerTurn === state.turnNumber) return state;
		slot.partyPowerTurn = state.turnNumber;
		return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 20, 'ABILITY');
	},
};
