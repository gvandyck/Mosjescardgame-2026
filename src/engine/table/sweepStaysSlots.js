// sweepStaysSlots — discard Stays Piecies whose end time has come. when: 'start' | 'end' (of playerId's turn).
import { discardPiecieSlot } from './discardPiecieSlot.js';
import { staysBoundGone } from './staysBoundGone.js';
import { payStaysStartGain } from './payStaysStartGain.js';

function linkedGone(state, playerId, e) {
	if (e.cardId !== 'piecie_call_of_welloes' || !e.linkedMosjeCardId) return false;
	return !state.players[playerId].activeSlots.some(
		s => s?.cardId === e.linkedMosjeCardId && s?.summonedByPiecie === 'piecie_call_of_welloes' && !s.isDefeated);
}

// Custom-end Piecies that simply last until the end of the owner's next turn (their effect may end them sooner).
const CUSTOM_END_OF_NEXT_TURN = new Set(['piecie_tikker', 'piecie_mp_hemorrhage', 'piecie_kleine_taks']);

export function sweepStaysSlots(state, playerId, when) {
	let next = state;
	for (const pid of Object.keys(state.players)) {
		(state.players[pid].piecieSlots || []).forEach((e, i) => {
			if (!e || e.stays !== true) return;
			const own = pid === playerId;
			if (staysBoundGone(next, e)) { next = discardPiecieSlot(next, pid, i); return; }
			if (when === 'start' && own && e.startGain?.length && (e.activatedRound ?? 0) < state.turnNumber) next = payStaysStartGain(next, pid, i);
			const older = (e.activatedRound ?? 0) < state.turnNumber;
			const gone =
				(when === 'start' && own && e.staysEnd === 'startOfNextTurn' && older) ||
				(when === 'end' && own && e.staysEnd === 'endOfNextTurn' && older) ||
				(when === 'end' && e.staysEnd === 'endOfTurn') ||
				(when === 'end' && own && e.staysEnd === 'custom' && (linkedGone(next, pid, e) || (CUSTOM_END_OF_NEXT_TURN.has(e.cardId) && older) || (e.cardId === 'piecie_mp_hemorrhage' && !e.marked)));
			if (gone) next = discardPiecieSlot(next, pid, i);
		});
	}
	return next;
}
