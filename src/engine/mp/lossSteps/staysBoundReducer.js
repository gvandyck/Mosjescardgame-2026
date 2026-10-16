// staysBoundReducer - Stays Piecies on the losing player's table that shrink a loss (never stop it):
//  boundTo [{ playerId, slotIndex, cardId, reduce }] - each loss of a covered Mosje is `reduce` less (stacks);
//  lossReduceOnce - the next loss of any of the owner's Mosjes is that much less, then the card is discarded.
import { staysBoundGone } from '../../table/staysBoundGone.js';
import { discardPiecieSlotInPlace } from '../../table/discardPiecieSlotInPlace.js';

export function staysBoundReducer(ctx) {
	const slots = ctx.state.players[ctx.playerId]?.piecieSlots || [];
	let amount = ctx.amount;
	slots.forEach((e, i) => {
		if (!e || e.stays !== true) return;
		if (e.boundTo?.length && !staysBoundGone(ctx.state, e)) {
			for (const b of e.boundTo) {
				if (b.playerId === ctx.playerId && b.slotIndex === ctx.slotIndex) amount -= b.reduce || 0;
			}
		}
		if (e.lossReduceOnce > 0) {
			amount -= e.lossReduceOnce;
			discardPiecieSlotInPlace(ctx.state, ctx.playerId, i);
		}
	});
	return Math.max(0, amount);
}
