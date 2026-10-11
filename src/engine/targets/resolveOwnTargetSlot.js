import { findTagSlot } from './findTagSlot.js';

function eligible(player, i, tag) {
	const slot = player?.activeSlots?.[i];
	if (!slot || slot.isDefeated) return false;
	return !tag || findTagSlot({ activeSlots: [slot] }, tag) === 0;
}

// Which of the player's own Mosjes an "you / your Mosje" effect hits: the chosen
// one (_pendingTargets.own_slot_index, consumed), else the only eligible one.
export function resolveOwnTargetSlot(state, playerId, { tag } = {}) {
	const player = state.players[playerId];
	const slots = player?.activeSlots || [];
	const chosen = state._pendingTargets?.own_slot_index;
	if (Number.isInteger(chosen) && eligible(player, chosen, tag)) {
		delete state._pendingTargets.own_slot_index;
		return chosen;
	}
	const all = slots.map((_, i) => i).filter(i => eligible(player, i, tag));
	if (all.length === 0) return -1;
	if (all.length > 1) console.warn('[TARGET] no own choice given, using first eligible Mosje');
	return all[0];
}
