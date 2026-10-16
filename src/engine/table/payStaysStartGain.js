// payStaysStartGain - "each gains N MP at the start of your next turn": pays entry.startGain [{ slotIndex, cardId, amount }]
// once (to Mosjes still in play) and clears it. Returns the new state.
import { gainMP } from '../mpManager.js';

export function payStaysStartGain(state, playerId, entryIndex) {
	const entry = state.players[playerId].piecieSlots[entryIndex];
	let next = state;
	for (const g of entry.startGain || []) {
		const slot = next.players[playerId].activeSlots[g.slotIndex];
		if (slot && !slot.isDefeated && slot.cardId === g.cardId) next = gainMP(next, playerId, g.slotIndex, g.amount, 'STAYS_START');
	}
	const piecieSlots = next.players[playerId].piecieSlots.slice();
	piecieSlots[entryIndex] = { ...entry, startGain: [] };
	return { ...next, players: { ...next.players, [playerId]: { ...next.players[playerId], piecieSlots } } };
}
