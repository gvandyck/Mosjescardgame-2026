// gainOwnMosje - "One of your Mosjes gains N MP": resolve the pick, gain amountOf(slot, state). Returns a new state.
import { cloneState } from './cloneState.js';
import { pieceDef } from './pieceDef.js';
import { resolvePiecieOwnSlot } from './resolvePiecieOwnSlot.js';
import { gainFromPiecie } from './gainFromPiecie.js';

export function gainOwnMosje(gameState, playerId, cardId, amountOf) {
	const state = cloneState(gameState);
	const si = resolvePiecieOwnSlot(state, playerId, cardId);
	if (si < 0) return state;
	return gainFromPiecie(state, playerId, si, amountOf(state.players[playerId].activeSlots[si], state), pieceDef(cardId));
}
