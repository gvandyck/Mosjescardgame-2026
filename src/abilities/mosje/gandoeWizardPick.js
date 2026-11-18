// Gandoe, The Cloude Wizard (second half), as a MOSJE_TRIGGERS 'wizardPick' entry so the pick can pause (pendingChoice).
// Options are the top 3 cards by position ({ label, index }); the pick goes to the hand, the others to the bottom in order.
// The options live only in the owner's pause, so the opponent's view never holds them (getBotView strips them).
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const KEY = 'wizard_pick';

export const gandoeWizardPick = {
	mosjeId: 'mosje_gandoe_wizard',
	run(state, ctx) {
		const player = state.players[ctx.ownerId];
		const n = Math.min(3, player.deck.length);
		if (n === 0) return state;
		const pick = player._pendingTargets?.[KEY];
		if (pick === undefined) {
			const options = player.deck.slice(0, n).map((c, index) => ({ label: toGraveyardEntry(c.cardId, 'x').name, index }));
			return { state, needChoice: { playerId: ctx.ownerId, choiceKind: 'handCard', key: KEY, options } };
		}
		if (player._pendingTargets) delete player._pendingTargets[KEY];
		const top = player.deck.slice(0, n);
		const taken = top[pick.index];
		if (!taken) return state;
		player.hand.push(taken);
		player.deck = [...player.deck.slice(n), ...top.filter((_, i) => i !== pick.index)];
		return state;
	},
};
