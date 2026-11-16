// withCosts - wraps a Piecie effect of a card with an activationCost: first the cost step (with its pause), then the
// card's own effect with ctx.costPaidBy = the Mosje that paid. costPaid / costPaidBy travel through the card's own
// pauses in needChoice.ctx, so a re-run never pays twice.
import { costStep } from './costStep.js';

export function withCosts(effect, cardDef) {
	return (state, playerId, ctx = {}) => {
		let costPaidBy = ctx.costPaidBy;
		if (ctx.costPaid !== true) {
			const step = costStep(state, playerId, ctx, cardDef);
			if (step.needChoice) return step;
			if (!step.paid) return step.state; // could not pay: the effect does nothing
			state = step.state;
			costPaidBy = step.paidBy;
		}
		if (typeof effect !== 'function') return state;
		const res = effect(state, playerId, { ...ctx, costPaid: true, costPaidBy });
		if (res && res.needChoice) {
			return { ...res, needChoice: { ...res.needChoice, ctx: { ...(res.needChoice.ctx || {}), costPaid: true, costPaidBy } } };
		}
		return res;
	};
}
