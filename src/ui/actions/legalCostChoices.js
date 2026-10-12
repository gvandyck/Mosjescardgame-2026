// legalCostChoices — every "First you must" payment the engine would accept for the face-up Quest of a stack.
import { rollQuestAttempt } from '../../engine/quests/rollQuestAttempt.js';
import { isReadyPiecieSlot } from '../../engine/quests/isReadyPiecieSlot.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const nameOf = (cardId) => toGraveyardEntry(cardId, 'x').name;

export function legalCostChoices(state, playerId, slotIndex, stackId) {
	const p = state.players[playerId];
	const candidates = [{ choice: undefined, label: 'No payment' }];
	(p.hand || []).forEach((c, index) => candidates.push({ choice: { zone: 'hand', index }, label: `Hand: ${nameOf(c.cardId)}` }));
	(p.piecieSlots || []).forEach((e, index) => {
		if (isReadyPiecieSlot(e, state.turnNumber)) candidates.push({ choice: { zone: 'ready', index }, label: `Ready: ${nameOf(e.cardId)}` });
	});
	return candidates.filter(c => rollQuestAttempt(state, playerId, { slotIndex, stackId, costChoice: c.choice, rng: () => 0 }).ok);
}
