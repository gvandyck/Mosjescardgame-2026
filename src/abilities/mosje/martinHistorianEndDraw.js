// Martin, The Historian - end of turn half of Time Control: "At the end of your turn, draw 2 cards" - only on turns
// Time Control was used (Card List ruling). A mid-turn draw never reshuffles; an empty deck draws nothing.
import { drawCards } from '../../engine/deckEngine.js';

export const martinHistorianEndDraw = {
	mosjeId: 'mosje_martin_historian',
	run(state, ctx) {
		const slot = state.players[ctx.ownerId].activeSlots[ctx.holderSlotIndex];
		if (slot.timeControlTurn !== state.turnNumber) return state;
		delete slot.timeControlTurn;
		const owner = state.players[ctx.ownerId];
		const { drawn, remaining } = drawCards(owner.deck, 2);
		owner.deck = remaining;
		owner.hand.push(...drawn);
		return state;
	},
};
