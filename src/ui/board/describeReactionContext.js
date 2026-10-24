// describeReactionContext.js — the context line of the reaction prompt (63-UI-SPEC "Reaction prompt", D-20, U6):
// "Alyssa attacks Ming: −20 MP". For an attack window it names the attacker and the target (first names) and the MP the
// target is about to lose: the window's dry-run preview for the target's slot when it has one, else the attacker's live Power.
// Any other window (Piecie activation, Quest roll, ...) has no such line and returns ''. Pure: reads the state, never changes it.
import { getPower } from '../../engine/mp/getPower.js';
import { parseMosjeName } from '../cardV1/parseMosjeName.js';

export function describeReactionContext(state) {
	const window = state?.pendingReaction;
	if (!window || window.action?.type !== 'attack') return '';
	const [attackerId, params] = window.action.args || [];
	const { attackerSlotIndex, targetPlayerId, targetSlotIndex } = params || {};
	const attacker = state.players?.[attackerId]?.activeSlots?.[attackerSlotIndex];
	const target = state.players?.[targetPlayerId]?.activeSlots?.[targetSlotIndex];
	if (!attacker || !target) return '';
	const loss = window.preview?.mpLoss?.[targetSlotIndex];
	const mp = typeof loss === 'number' ? loss : getPower(attacker, state, attackerId);
	return `${parseMosjeName(attacker.name).firstName} attacks ${parseMosjeName(target.name).firstName}: −${mp} MP`;
}
