// showNewReveals - the reveal modal (EFX-07): when a card newly shows hidden cards to the LOCAL player, list them on the
// existing read-only hand viewer. Never reads the other player's entries. A pick modal that already lists the cards
// (a pending choice for the local player, e.g. Stookerino) counts as the reveal, so no second modal opens.
import { getRevealedFor } from '../engine/hidden/getRevealedFor.js';

export function showNewReveals(state, localPlayerId, modal, cardLookup, seen) {
	const fresh = getRevealedFor(state, localPlayerId).filter(e => !seen.has(`${e.source}|${e.turnNumber}|${e.cardIds.join(',')}`));
	for (const e of fresh) seen.add(`${e.source}|${e.turnNumber}|${e.cardIds.join(',')}`);
	if (!fresh.length || state.pendingChoice?.playerId === localPlayerId) return false;
	const last = fresh[fresh.length - 1];
	modal.showHandViewerModal(last.cardIds, 'Opponent', cardLookup);
	return true;
}
