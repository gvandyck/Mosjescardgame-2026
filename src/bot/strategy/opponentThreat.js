// opponentThreat - the Power the opponent can hit with on their next turn: the engine Power (level row, Place, boosts) of
// every upright Mosje. A fresh Mosje counts (it can attack on its owner's next turn); a sideways or defeated one cannot.
import { getPower } from '../../engine/mp/getPower.js';
import { asBotView } from './asBotView.js';

export function opponentThreat(state, botId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	let total = 0;
	for (const [seatId, seat] of Object.entries(view.players || {})) {
		if (seatId === botId) continue;
		for (const slot of seat.activeSlots || []) {
			if (!slot || slot.isDefeated || slot.sideways) continue;
			total += getPower(slot, view, seatId);
		}
	}
	return total;
}
