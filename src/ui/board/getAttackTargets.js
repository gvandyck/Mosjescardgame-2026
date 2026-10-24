// getAttackTargets.js — every live opposing Mosje with its attack validity (63-UI-SPEC "Targeting", D-04, D-06).
// Returns [{ playerId, slotIndex, valid, short, reason }]. An invalid target carries the short badge word ('Fresh' or
// 'Protected') and the full reason the toast shows; a valid one has both empty. The engine rule is isValidAttackTarget.
import { isValidAttackTarget } from '../../engine/actions/isValidAttackTarget.js';
import { isFresh } from '../../engine/fresh/isFresh.js';

export function getAttackTargets(state, playerId) {
	const out = [];
	for (const [targetId, player] of Object.entries(state?.players || {})) {
		if (targetId === playerId) continue;
		(player.activeSlots || []).forEach((slot, slotIndex) => {
			if (!slot || slot.isDefeated) return;
			const valid = isValidAttackTarget(state, playerId, targetId, slotIndex);
			const fresh = isFresh(slot);
			out.push({
				playerId: targetId,
				slotIndex,
				valid,
				short: valid ? '' : fresh ? 'Fresh' : 'Protected',
				reason: valid ? '' : fresh ? "Fresh Mosjes can't be attacked" : "Level-up protected: can't be attacked this turn",
			});
		});
	}
	return out;
}
