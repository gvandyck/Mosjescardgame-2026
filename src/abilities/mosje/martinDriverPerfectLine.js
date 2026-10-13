// Martin, The Precision Driver — Perfect Line: whenever this Mosje succeeds at a Quest it gains 15 MP extra.
import { gainMP } from '../../engine/mpManager.js';

export const martinDriverPerfectLine = {
	mosjeId: 'mosje_martin_driver',
	run(state, ctx) {
		if (ctx.slotIndex !== ctx.holderSlotIndex || ctx.playerId !== ctx.ownerId) return state;
		return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 15, 'ABILITY');
	},
};
