// discardFromHand - THE one hand discard: moves hand[handIndex] to the owner's pile and returns the card. Works on the
// cloned state the caller holds. A Personal Quest is refused (returns null) when another player's effect discards it (D-06);
// the owner's own discard (byPlayerId absent or equal to playerId) may. Fires the Discarded keyword hook (70-07).
import { toGraveyardEntry } from '../graveyardUtils.js';
import { isOpponentProof } from './isOpponentProof.js';
import { runKeywordHook } from '../keywords/runKeywordHook.js';

export function discardFromHand(state, playerId, handIndex, { byPlayerId = playerId } = {}) {
	const player = state.players[playerId];
	const card = player?.hand?.[handIndex];
	if (!card) return null;
	if (byPlayerId !== playerId && isOpponentProof(card)) return null;
	player.hand.splice(handIndex, 1);
	player.graveyard = [...(player.graveyard || []), toGraveyardEntry(card.cardId, 'discarded')];
	runKeywordHook(state, 'discarded', card.cardId, { playerId, ownerId: playerId, byPlayerId });
	return card;
}
