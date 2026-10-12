// sweepStaysSlots — discard Stays Piecies whose end time has come. when: 'start' | 'end' (of playerId's turn).
import { discardPiecieSlot } from './discardPiecieSlot.js';

function linkedGone(state, playerId, e) {
	if (e.cardId !== 'piecie_call_of_welloes' || !e.linkedMosjeCardId) return false;
	return !state.players[playerId].activeSlots.some(
		s => s?.cardId === e.linkedMosjeCardId && s?.summonedByPiecie === 'piecie_call_of_welloes' && !s.isDefeated);
}

export function sweepStaysSlots(state, playerId, when) {
	let next = state;
	for (const pid of Object.keys(state.players)) {
		(state.players[pid].piecieSlots || []).forEach((e, i) => {
			if (!e || e.stays !== true) return;
			const own = pid === playerId;
			const older = (e.activatedRound ?? 0) < state.turnNumber;
			const gone =
				(when === 'start' && own && e.staysEnd === 'startOfNextTurn' && older) ||
				(when === 'end' && own && e.staysEnd === 'endOfNextTurn' && older) ||
				(when === 'end' && e.staysEnd === 'endOfTurn') ||
				(when === 'end' && own && e.staysEnd === 'custom' && linkedGone(next, pid, e));
			if (gone) next = discardPiecieSlot(next, pid, i);
		});
	}
	return next;
}
