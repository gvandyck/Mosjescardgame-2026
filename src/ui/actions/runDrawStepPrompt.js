// runDrawStepPrompt — when state.pendingDrawStep belongs to the local player, offer the draw-step abilities
// (normal draw first), collect their inputs and call finishDrawStep. Returns the new state.
import { finishDrawStep } from '../../engine/mosje/finishDrawStep.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { MOSJES } from '../../data/mosjes.js';
import { collectAbilityInputs } from './collectAbilityInputs.js';
import { offerHistorianKeep } from './offerHistorianKeep.js';

export async function runDrawStepPrompt({ state, localPlayerId, modal }) {
	const pending = state.pendingDrawStep;
	if (!pending || pending.playerId !== localPlayerId) return state;
	const use = [];
	const choices = {};
	for (let guard = 0; guard < 4; guard++) {
		const left = pending.options.filter(o => !use.includes(o.mosjeId));
		if (left.length === 0) break;
		const id = await modal.showOptionSelect({
			title: 'Draw step',
			prompt: 'Draw normally, or use a Mosje ability instead.',
			options: [{ id: 'draw', label: 'Draw normally' }, ...left.map(o => ({ id: o.mosjeId, label: MOSJES.find(m => m.id === o.mosjeId)?.name ?? o.mosjeId }))],
		});
		if (id == null || id === 'draw') break;
		const abilityId = MOSJES.find(m => m.id === id)?.abilityId;
		const inputs = MOSJE_ABILITY_RULES[abilityId]?.inputs || [];
		const collected = await collectAbilityInputs({ state, playerId: localPlayerId, modal, inputs });
		if (collected == null) continue; // cancelled: back to the list
		if (id === 'mosje_martin_historian') {
			const keepCardId = await offerHistorianKeep({ state, playerId: localPlayerId, modal, collected });
			if (keepCardId) collected.keepCardId = keepCardId;
		}
		use.push(id);
		choices[id] = collected;
	}
	const res = finishDrawStep(state, localPlayerId, { use, ...choices });
	return res.ok ? res.state : state;
}
