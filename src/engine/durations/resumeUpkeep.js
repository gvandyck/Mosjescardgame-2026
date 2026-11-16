// resumeUpkeep - apply the answer to an Upkeep pause ({ pay: true | false }), then ask for the next Upkeep card.
// Paying goes through payEnergy (a Place fee applies as for any payment); if it cannot be paid the card is discarded.
// Returns the state (it may hold a new pendingChoice).
import { payEnergy } from '../energy/payEnergy.js';
import { discardUpkeepCard } from './discardUpkeepCard.js';
import { runUpkeep } from './runUpkeep.js';

export function resumeUpkeep(state, pc, value) {
	const item = pc.ctx;
	const player = state.players[pc.playerId];
	let kept = false;
	if (value?.pay === true && player) {
		kept = payEnergy(state, pc.playerId, 1).success;
	}
	if (kept) {
		const entry = item.where === 'piecie'
			? player.piecieSlots[item.slotIndex]
			: (player.activeSlots[item.slotIndex]?.attachments || []).find(a => a.cardId === item.cardId);
		if (entry && entry.cardId === item.cardId) entry.upkeepPaidTurn = state.turnNumber;
	} else {
		discardUpkeepCard(state, pc.playerId, item);
	}
	return runUpkeep(state, pc.playerId);
}
