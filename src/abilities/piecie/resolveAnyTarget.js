// resolveAnyTarget - Varkenspootjes' "any Mosje that isn't fresh" pick: { playerId, slotIndex } from
// state._pendingTargets.any_target (consumed), re-checked against the target table. Without a pick: a Binti
// (own first), else the first opponent Mosje, else the first own one. Returns null when nothing is allowed.
import { piecieTargetOptions } from '../../engine/targets/piecieTargetOptions.js';
import { isFriend } from '../../engine/friends/isFriend.js';
import { markTargeted } from '../../engine/targets/markTargeted.js';

export function resolveAnyTarget(state, playerId, cardId) {
	const t = pickAnyTarget(state, playerId, cardId);
	if (t) markTargeted(state, t.playerId, t.slotIndex); // the Target step (D-20)
	return t;
}

function pickAnyTarget(state, playerId, cardId) {
	const options = piecieTargetOptions(state, playerId, cardId).find(s => s.key === 'any_target')?.options || [];
	const chosen = state._pendingTargets?.any_target;
	if (chosen !== undefined) {
		delete state._pendingTargets.any_target;
		return options.find(o => o.playerId === chosen?.playerId && o.slotIndex === chosen?.slotIndex) || null;
	}
	const isBinti = o => isFriend(state.players[o.playerId].activeSlots[o.slotIndex], ['Binti']);
	const own = options.filter(o => o.playerId === playerId);
	const opp = options.filter(o => o.playerId !== playerId);
	return own.find(isBinti) || opp.find(isBinti) || opp[0] || own[0] || null;
}
