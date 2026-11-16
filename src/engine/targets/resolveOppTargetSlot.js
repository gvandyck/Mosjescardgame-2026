import { isFresh } from '../fresh/isFresh.js';
import { isShielded } from './isShielded.js';
import { markTargeted } from './markTargeted.js';

// Opponent single-target slot: the chosen one (_pendingTargets.opp_slot_index, consumed),
// else the first non-fresh Mosje (fresh ones are opponent-proof), else -1.
export function resolveOppTargetSlot(state, oppId) {
	if (isShielded(state, oppId, 'opponent')) return -1; // Blensen!: no card may target them
	const slots = state.players[oppId]?.activeSlots || [];
	const ok = i => slots[i] && !slots[i].isDefeated;
	const chosen = state._pendingTargets?.opp_slot_index;
	if (Number.isInteger(chosen) && ok(chosen)) {
		delete state._pendingTargets.opp_slot_index;
		markTargeted(state, oppId, chosen);
		return chosen;
	}
	const idxs = slots.map((_, i) => i).filter(ok);
	const open = idxs.filter(i => !isFresh(slots[i]));
	const pick = open.length ? open[0] : (idxs[0] ?? -1);
	markTargeted(state, oppId, pick); // the Target step (D-20); ignores -1
	return pick;
}
