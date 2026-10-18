// orderActingMosjes - which own Mosjes have a worthwhile action right now, best first: slot indexes sorted by the value of
// scoreMosjeAction (ties to the lower slot). A Mosje with nothing worth doing is left out. The driver asks again after
// every action, because one attack changes what the next one is worth.
import { scoreMosjeAction } from './scoreMosjeAction.js';
import { asBotView } from './asBotView.js';

export function orderActingMosjes(state, botId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const scored = [];
	(view.players[botId]?.activeSlots || []).forEach((_, slotIndex) => {
		const best = scoreMosjeAction(view, botId, slotIndex);
		if (best) scored.push({ slotIndex, value: best.value });
	});
	return scored.sort((a, b) => b.value - a.value || a.slotIndex - b.slotIndex).map(s => s.slotIndex);
}
