// mpLoss { amount } - the Mosje at ctx.slotIndex loses exactly that MP and must stay above 0.
// canPay returns true or a reason string.
import { canPayMpCost } from '../canPayMpCost.js';
import { payMpCost } from '../payMpCost.js';

const slotOf = (ctx) => ctx.state.players[ctx.playerId]?.activeSlots?.[ctx.slotIndex];

export const mpLossCost = {
	canPay(ctx, cost) {
		return canPayMpCost(slotOf(ctx), cost.amount) || `That Mosje cannot pay ${cost.amount} MP (it must stay above 0)`;
	},
	pay(ctx, cost) {
		payMpCost(slotOf(ctx), cost.amount);
	},
};
