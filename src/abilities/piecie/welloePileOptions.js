// welloePileOptions - one pick option per distinct Mosje in the player's pile.
import { getPileMosjes } from '../../engine/pile/getPileMosjes.js';

export function welloePileOptions(player) {
	const seen = new Set();
	return getPileMosjes(player).filter(e => !seen.has(e.cardId) && seen.add(e.cardId))
		.map(e => ({ label: e.name, cardId: e.cardId }));
}
