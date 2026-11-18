// fieldFriend { friends } - the player has a live Mosje on the field that is one of the named friends.
import { friendSlotsOnField } from '../../friends/friendSlotsOnField.js';

export const fieldFriend = {
	check(ctx, need) {
		if (friendSlotsOnField(ctx.state, ctx.playerId, need.friends).length) return { ok: true };
		return { ok: false, reason: `Needs ${need.friends.map(f => `a ${f}`).join(' or ')}` };
	},
};
