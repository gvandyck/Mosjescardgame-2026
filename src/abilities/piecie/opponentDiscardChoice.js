// opponentDiscardChoice - "your opponent discards 1 card of their choice" as ONE pause that belongs to the opponent.
// Options come from opponentPickableHand (one per distinct card, a Personal Quest never, D-06); the answer lives in the
// opponent's _pendingTargets[key] and is checked against the hand again. discardFromHand fires Discarded and refuses a
// Personal Quest a second time by byPlayerId. Returns the state, or { state, needChoice } like discardChoice.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { opponentPickableHand } from '../../engine/hand/opponentPickableHand.js';
import { discardFromHand } from '../../engine/hand/discardFromHand.js';

export function opponentDiscardChoice(state, oppId, byPlayerId, key, ctx = {}) {
	const opp = state.players[oppId];
	if (!opp) return state;
	const pickable = opponentPickableHand(opp.hand);
	if (!pickable.length) return state;
	const pick = opp._pendingTargets?.[key];
	if (pick === undefined) {
		const options = [...new Set(pickable.map(i => opp.hand[i].cardId))]
			.map(cardId => ({ label: toGraveyardEntry(cardId, 'discarded').name, cardId }));
		return { state, needChoice: { playerId: oppId, choiceKind: 'handCard', key, options, prompt: 'Discard 1 card from your hand', ctx } };
	}
	delete opp._pendingTargets[key];
	const at = pickable.find(i => opp.hand[i].cardId === pick.cardId);
	if (at !== undefined) discardFromHand(state, oppId, at, { byPlayerId });
	return state;
}
