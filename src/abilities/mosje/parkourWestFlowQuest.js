// Parkour West, The Flow Fighter — Flow (Quest half): when this Mosje succeeds at a Quest it gains 20 MP.
// (The "loses 20 less when taksed" half lives in attack/flowTaksedReducer.js.)
import { gainMP } from '../../engine/mpManager.js';

export const parkourWestFlowQuest = {
	mosjeId: 'mosje_parkour_west',
	run(state, ctx) {
		if (ctx.slotIndex !== ctx.holderSlotIndex || ctx.playerId !== ctx.ownerId) return state;
		return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 20, 'QUEST');
	},
};
