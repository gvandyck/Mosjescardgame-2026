// energyAny - pay any amount of Energy the player picks (choice.energy, default 0), never more than they have.
import { canPay } from '../../energy/canPay.js';
import { payEnergy } from '../../energy/payEnergy.js';

const amountOf = (choice) => (choice && choice.energy !== undefined ? choice.energy : 0);

export const energyAnyCost = {
	canPay(ctx, cost, choice) {
		return canPay(ctx.state.players[ctx.playerId], amountOf(choice)) || 'Not enough Energy';
	},
	pay(ctx, cost, choice) {
		payEnergy(ctx.state, ctx.playerId, amountOf(choice));
	},
};
