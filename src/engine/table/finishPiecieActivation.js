// finishPiecieActivation — after a Piecie resolves: Stays cards keep their slot face-up, others go to discard.
import { discardPiecieSlot } from './discardPiecieSlot.js';

export function finishPiecieActivation(state, playerId, slotIndex, cardDef) {
	const p = state.players[playerId];
	const entry = p?.piecieSlots?.[slotIndex];
	if (!entry) return state;
	if (!cardDef?.stays) return discardPiecieSlot(state, playerId, slotIndex);
	const piecieSlots = p.piecieSlots.slice();
	piecieSlots[slotIndex] = {
		...entry, stays: true, staysEnd: cardDef.stays,
		activatedRound: state.turnNumber, faceDown: false, activated: true,
	};
	return { ...state, players: { ...state.players, [playerId]: { ...p, piecieSlots } } };
}
