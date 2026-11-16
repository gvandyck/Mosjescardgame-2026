// runUpkeep - the LAST step of the owner's turn start: each of their cards with Upkeep (def.upkeep: staying Piecies in a slot,
// attachments on a Mosje) costs 1 Energy or is discarded. 0 Energy: discarded without a question. Otherwise the first unpaid
// card pauses on state.pendingChoice (hook 'upkeep'); resumeUpkeep applies the answer and calls this again for the next card.
// A card paid this turn is marked (upkeepPaidTurn) so a resume never asks twice. Mutates the (already cloned) state.
import { PIECIES } from '../../data/piecies.js';
import { discardUpkeepCard } from './discardUpkeepCard.js';

const hasUpkeep = (cardId) => PIECIES.find(p => p.id === cardId)?.upkeep === true;

function listUpkeepCards(state, playerId) {
	const player = state.players[playerId];
	const out = [];
	(player.piecieSlots || []).forEach((e, slotIndex) => {
		if (e && hasUpkeep(e.cardId)) out.push({ where: 'piecie', slotIndex, cardId: e.cardId, entry: e });
	});
	(player.activeSlots || []).forEach((s, slotIndex) => {
		(s?.attachments || []).forEach((a, attachIndex) => {
			if (hasUpkeep(a.cardId)) out.push({ where: 'attachment', slotIndex, attachIndex, cardId: a.cardId, entry: a });
		});
	});
	return out;
}

export function runUpkeep(state, playerId) {
	if (!state.players?.[playerId]) return state;
	for (let guard = 0; guard < 20; guard++) {
		const next = listUpkeepCards(state, playerId).find(c => c.entry.upkeepPaidTurn !== state.turnNumber);
		if (!next) return state;
		if ((state.players[playerId].energy || 0) < 1) {
			discardUpkeepCard(state, playerId, next);
			continue;
		}
		const name = PIECIES.find(p => p.id === next.cardId)?.name || next.cardId;
		const { entry, ...ctx } = next;
		state.pendingChoice = {
			hook: 'upkeep', playerId, actorId: playerId, key: 'upkeep', choiceKind: 'upkeep',
			prompt: `Upkeep: pay 1 Energy to keep ${name}, or discard it`,
			options: [{ label: 'Pay 1 Energy', pay: true }, { label: 'Discard', pay: false }],
			ctx,
		};
		return state;
	}
	return state;
}
