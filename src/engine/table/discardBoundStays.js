// discardBoundStays - a Stays Piecie bound to a Mosje goes to the discard pile as soon as that Mosje has left play.
import { discardPiecieSlot } from './discardPiecieSlot.js';
import { staysBoundGone } from './staysBoundGone.js';

export function discardBoundStays(state) {
	let next = state;
	for (const pid of Object.keys(state.players)) {
		(state.players[pid].piecieSlots || []).forEach((e, i) => {
			if (e?.stays === true && e.boundTo?.length && staysBoundGone(next, e)) next = discardPiecieSlot(next, pid, i);
		});
	}
	return next;
}
