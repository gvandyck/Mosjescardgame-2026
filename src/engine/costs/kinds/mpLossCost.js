// mpLoss { amount } - the Mosje at ctx.slotIndex loses exactly that MP and must stay above 0.
// canPay returns true or a reason string. cost.freeFor (friend names): that friend can always pay and pays nothing.
import { canPayMpCost } from '../canPayMpCost.js';
import { payMpCost } from '../payMpCost.js';
import { isFriend } from '../../friends/isFriend.js';

const slotOf = (ctx) => ctx.state.players[ctx.playerId]?.activeSlots?.[ctx.slotIndex];

const isFree = (ctx, cost) => Array.isArray(cost.freeFor) && isFriend(slotOf(ctx), cost.freeFor);

export const mpLossCost = {
	canPay(ctx, cost) {
		if (isFree(ctx, cost)) return true;
		return canPayMpCost(slotOf(ctx), cost.amount) || `That Mosje cannot pay ${cost.amount} MP (it must stay above 0)`;
	},
	pay(ctx, cost) {
		if (isFree(ctx, cost)) return;
		payMpCost(slotOf(ctx), cost.amount);
	},
};
