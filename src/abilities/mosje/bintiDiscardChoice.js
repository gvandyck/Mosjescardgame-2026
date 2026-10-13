// Binti — Cutting Words (second half), as a MOSJE_TRIGGERS 'bintiDiscard' entry so the opponent's pick can use the
// pendingChoice machinery: the opponent discards 1 card of THEIR choice (auto when they hold one kind of card,
// nothing with an empty hand). Fired by bintiCuttingWords; the pick lives in the opponent's _pendingTargets.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const KEY = 'binti_discard_card';

export const bintiDiscardChoice = {
	mosjeId: 'mosje_binti',
	run(state, ctx) {
		const oppId = ctx.discarderId;
		const opp = state.players[oppId];
		if (!opp || !opp.hand.length) return state;
		const pick = opp._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = [...new Set(opp.hand.map(c => c.cardId))]
				.map(cardId => ({ label: toGraveyardEntry(cardId, 'x').name, cardId }));
			return { state, needChoice: { playerId: oppId, choiceKind: 'handCard', key: KEY, options } };
		}
		if (opp._pendingTargets) delete opp._pendingTargets[KEY];
		const i = opp.hand.findIndex(c => c.cardId === pick.cardId);
		if (i >= 0) opp.graveyard.push(...opp.hand.splice(i, 1));
		return state;
	},
};
