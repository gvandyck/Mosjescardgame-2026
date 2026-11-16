// withAttach - wraps a Piecie effect of an Attach card: first the attach step (with its pauses), then the card's own
// effect (when it has one) with ctx.attachedTo = the Mosje slot index. The index travels through the card's own
// pauses in needChoice.ctx, so a re-run does not attach twice.
import { attachStep } from './attachStep.js';

export function withAttach(effect, cardDef) {
	return (state, playerId, ctx = {}) => {
		let attachedTo = ctx.attachedTo;
		if (attachedTo === undefined) {
			const step = attachStep(state, playerId, ctx, cardDef);
			if (step.needChoice) return step;
			if (step.attachedTo === undefined) return step.state; // nothing to attach to: the effect does nothing
			state = step.state;
			attachedTo = step.attachedTo;
		}
		if (typeof effect !== 'function') return state;
		const res = effect(state, playerId, { ...ctx, attachedTo });
		if (res && res.needChoice) {
			return { ...res, needChoice: { ...res.needChoice, ctx: { ...(res.needChoice.ctx || {}), attachedTo } } };
		}
		return res;
	};
}
