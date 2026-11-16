// energy { amount } - pay a fixed amount of Energy.
import { canPay } from '../../energy/canPay.js';
import { payEnergy } from '../../energy/payEnergy.js';

export const energyCost = {
	canPay(ctx, cost) {
		return canPay(ctx.state.players[ctx.playerId], cost.amount) || 'Not enough Energy';
	},
	pay(ctx, cost) {
		payEnergy(ctx.state, ctx.playerId, cost.amount);
	},
};
