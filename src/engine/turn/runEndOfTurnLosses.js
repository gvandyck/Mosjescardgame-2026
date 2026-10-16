// runEndOfTurnLosses - "At the end of the turn it loses N MP": pays the scheduled losses of playerId that are due.
// player.endOfTurnLosses entries: { slotIndex, cardId, amount, dueTurnOf, dueRound }. A loss goes through loseMP
// (reducers apply, it can getemt); it is skipped when that Mosje has left play. Entries not due yet are kept.
import { loseMP } from '../mpManager.js';

export function runEndOfTurnLosses(state, playerId) {
	const list = state.players[playerId]?.endOfTurnLosses;
	if (!Array.isArray(list) || !list.length) return state;
	const due = list.filter(e => e.dueTurnOf === playerId && state.turnNumber >= (e.dueRound ?? 0));
	state.players[playerId].endOfTurnLosses = list.filter(e => !due.includes(e));
	let next = state;
	for (const e of due) {
		const slot = next.players[playerId].activeSlots[e.slotIndex];
		if (!slot || slot.isDefeated || slot.cardId !== e.cardId) continue;
		next = loseMP(next, playerId, e.slotIndex, e.amount, 'DRAIN', false, null);
	}
	return next;
}
