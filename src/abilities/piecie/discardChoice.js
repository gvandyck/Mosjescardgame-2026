// discardChoice - "discard 1 card from your hand" as a pause: the player picks (auto when the hand holds one kind of
// card, nothing with an empty hand); the pick lives in their _pendingTargets[key]. ctx is carried across the pause.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { discardFromHand } from '../../engine/hand/discardFromHand.js';

export function discardChoice(state, playerId, key, ctx = {}) {
	const player = state.players[playerId];
	if (!player || !player.hand.length) return state;
	const pick = player._pendingTargets?.[key];
	if (pick === undefined) {
		const options = [...new Set(player.hand.map(c => c.cardId))]
			.map(cardId => ({ label: toGraveyardEntry(cardId, 'discarded').name, cardId }));
		return { state, needChoice: { playerId, choiceKind: 'handCard', key, options, ctx } };
	}
	delete player._pendingTargets[key];
	const i = player.hand.findIndex(c => c.cardId === pick.cardId);
	if (i >= 0) discardFromHand(state, playerId, i, { byPlayerId: playerId }); // the one hand discard: fires Discarded
	return state;
}
