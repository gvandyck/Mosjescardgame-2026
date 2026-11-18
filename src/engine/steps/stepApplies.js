// stepApplies - does a step's `onlyIf` hold? onlyIf: { friendOnField: [names], pickedFriend: [names], combo: true }; all given keys must hold.
import { friendSlotsOnField } from '../friends/friendSlotsOnField.js';
import { isFriend } from '../friends/isFriend.js';

export function stepApplies(state, playerId, step, picked, ctx = {}) {
	const cond = step.onlyIf;
	if (!cond) return true;
	if (cond.friendOnField && friendSlotsOnField(state, playerId, cond.friendOnField).length === 0) return false;
	if (cond.pickedFriend) {
		const slot = picked >= 0 ? state.players[playerId].activeSlots[picked] : null;
		if (!isFriend(slot, cond.pickedFriend)) return false;
	}
	if (cond.combo && ctx.combo !== true) return false;
	return true;
}
