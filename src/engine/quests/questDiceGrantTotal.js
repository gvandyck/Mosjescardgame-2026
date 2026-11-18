// questDiceGrantTotal - pure: the sum of the player's die grants that count for this roller. A bound grant counts only for
// its slot index and card id; friendAmount replaces the amount when the roller is one of the listed friends.
import { isFriend } from '../friends/isFriend.js';
import { grantCountsFor } from './grantCountsFor.js';

export function questDiceGrantTotal(state, playerId, slot) {
	const player = state?.players?.[playerId];
	const slotIndex = player?.activeSlots?.indexOf(slot) ?? -1;
	return (player?.questDiceGrants || [])
		.filter(g => grantCountsFor(g, slot, slotIndex))
		.reduce((sum, g) => sum + (g.friendAmount && isFriend(slot, g.friendAmount.friends) ? g.friendAmount.amount : g.amount), 0);
}
