// placeInPlay { placeId } - that Place is the active Place.
import { PLACES } from '../../../data/places.js';

export const placeInPlay = {
	check(ctx, need) {
		if (ctx.state.activePlace === need.placeId) return { ok: true };
		const name = (PLACES.find(p => p.id === need.placeId)?.name || need.placeId).replace(/^The /, '');
		return { ok: false, reason: `Needs: ${name} in play` };
	},
};
