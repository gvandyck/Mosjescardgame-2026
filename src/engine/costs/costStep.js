// costStep - the "pay the price before the semicolon" half of activating a card (D-22). Same shape as attachStep.
// With an mpLoss cost it asks which own Mosje pays (key cost_mosje, kind ownMosje; only Mosjes that can pay are
// offered). Then it pays with payCosts. Returns { state, needChoice } while it needs an answer,
// { state, paid: true, paidBy } when paid (paidBy = Mosje slot index or undefined), or { state } when nothing could
// be paid (the effect then does nothing). Mutates the already cloned state.
import { canPayCosts } from './canPayCosts.js';
import { payCosts } from './payCosts.js';

export function costStep(state, playerId, ctx, cardDef) {
	const costs = cardDef.activationCost || [];
	if (costs.length === 0) return { state, paid: true };
	const player = state.players[playerId];
	const targets = player._pendingTargets || {};
	const choice = targets.cost_choice || {};
	const base = { state, playerId };

	if (!costs.some(c => c.kind === 'mpLoss')) {
		if (!payCosts({ ...base, slotIndex: null }, costs, choice).ok) return { state };
		return { state, paid: true };
	}

	const options = (player.activeSlots || [])
		.map((s, slotIndex) => ({ s, slotIndex }))
		.filter(({ s, slotIndex }) => s && !s.isDefeated && canPayCosts({ ...base, slotIndex }, costs, choice).ok)
		.map(({ s, slotIndex }) => ({ label: s.name, slotIndex }));
	if (options.length === 0) return { state };

	const pick = targets.cost_mosje;
	if (pick === undefined) {
		return { state, needChoice: { playerId, choiceKind: 'ownMosje', key: 'cost_mosje', options, prompt: 'Which Mosje pays?' } };
	}
	delete player._pendingTargets.cost_mosje;
	if (!options.some(o => o.slotIndex === pick.slotIndex)) return { state }; // an answer that cannot pay: refused
	const res = payCosts({ ...base, slotIndex: pick.slotIndex }, costs, choice);
	if (!res.ok) return { state };
	return { state, paid: true, paidBy: pick.slotIndex };
}
