// runMosjeAbilityFlow — the ONE data-driven path for a human using a Mosje ability.
// Reads MOSJE_ABILITY_RULES[abilityId].inputs, asks only for inputs not already preset in _pendingTargets,
// writes the answers to _pendingTargets, calls useMosjeAbility, then settles reactions and Mosje pauses.
// Returns { state, ok, cancelled?, error?, name }; main.js owns logging, sync and rendering.
import { useMosjeAbility } from '../../engine/turnManager.js';
import { MOSJE_ABILITY_RULES } from '../../rules/mosjeAbilityRules.js';
import { MOSJES } from '../../data/mosjes.js';
import { collectAbilityInputs } from './collectAbilityInputs.js';

export async function runMosjeAbilityFlow({ state, playerId, mosjeId, modal, settle = async s => s, settlePauses = async s => s }) {
	const def = MOSJES.find(m => m.id === mosjeId);
	const name = def?.name ?? mosjeId;
	const inputs = MOSJE_ABILITY_RULES[def?.abilityId]?.inputs || [];
	const collected = await collectAbilityInputs({ state, playerId, modal, inputs, preset: state._pendingTargets || {} });
	if (collected == null) return { state, ok: false, cancelled: true, name };

	const staged = JSON.parse(JSON.stringify(state));
	staged._pendingTargets = { ...(staged._pendingTargets || {}), ...collected };
	const res = useMosjeAbility(staged, playerId, mosjeId);
	if (!res.success) return { state, ok: false, error: res.error, name };

	let next = res.state;
	for (const k of Object.keys(collected)) delete next._pendingTargets?.[k]; // never leave a stale answer
	if (next.pendingReaction) next = await settle(next);
	next = await settlePauses(next);
	return { state: next, ok: true, name };
}
