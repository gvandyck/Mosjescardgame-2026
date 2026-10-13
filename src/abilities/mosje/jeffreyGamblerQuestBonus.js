// Jeffrey, The Silent Gambler - High Stakes (5-6): the next Quest success this turn gives +15 MP extra.
// A questSuccess trigger: it fires once, for the Mosje that succeeded, and only on the turn High Stakes armed it.
import { gainMP } from '../../engine/mpManager.js';

export const jeffreyGamblerQuestBonus = {
	mosjeId: 'mosje_jeffrey_gambler',
	run(state, ctx) {
		const owner = state.players[ctx.ownerId];
		if (ctx.playerId !== ctx.ownerId || owner.gamblerQuestBonusTurn !== state.turnNumber) return state;
		delete owner.gamblerQuestBonusTurn;
		return gainMP(state, ctx.ownerId, ctx.slotIndex, 15, 'ABILITY');
	},
};
