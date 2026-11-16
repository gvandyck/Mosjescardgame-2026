// Binti — Cutting Words (second half), as a MOSJE_TRIGGERS 'bintiDiscard' entry so the opponent's pick can use the
// pendingChoice machinery: the opponent discards 1 card of THEIR choice (auto when they hold one kind of card,
// nothing with an empty hand). Fired by bintiCuttingWords; the pick lives in the opponent's _pendingTargets.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';
import { opponentPickableHand } from '../../engine/hand/opponentPickableHand.js';
import { discardFromHand } from '../../engine/hand/discardFromHand.js';

const KEY = 'binti_discard_card';

export const bintiDiscardChoice = {
	mosjeId: 'mosje_binti',
	run(state, ctx) {
		const oppId = ctx.discarderId;
		const opp = state.players[oppId];
		// Cutting Words is the opponent's effect: a Personal Quest is never an option (D-06)
		const pickable = opp ? opponentPickableHand(opp.hand).map(i => opp.hand[i]) : [];
		if (!pickable.length) return state;
		const pick = opp._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = [...new Set(pickable.map(c => c.cardId))]
				.map(cardId => ({ label: toGraveyardEntry(cardId, 'x').name, cardId }));
			return { state, needChoice: { playerId: oppId, choiceKind: 'handCard', key: KEY, options } };
		}
		if (opp._pendingTargets) delete opp._pendingTargets[KEY];
		const i = opp.hand.findIndex(c => c.cardId === pick.cardId);
		if (i >= 0) discardFromHand(state, oppId, i, { byPlayerId: ctx.playerId });
		return state;
	},
};
