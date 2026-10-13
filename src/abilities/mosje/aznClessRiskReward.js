// AZN Cless, The Wild Card — Risk & Reward: at the end of your turn roll a die:
// 1 discard a card of your choice from your hand; 6 draw 2 cards and this Mosje gains 10 MP.
import { rollDie, drawCards } from '../../engine/deckEngine.js';
import { gainMP } from '../../engine/mpManager.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const KEY = 'cless_discard';

export const aznClessRiskReward = {
	mosjeId: 'mosje_azn_cless',
	run(state, ctx) {
		const roll = ctx.roll ?? rollDie(6);
		const owner = state.players[ctx.ownerId];
		if (roll === 1) {
			if (!owner.hand.length) return state;
			const pick = owner._pendingTargets?.[KEY];
			if (pick === undefined) {
				const options = owner.hand.map((c, i) => ({ label: toGraveyardEntry(c.cardId ?? c, 'discarded').name, handIndex: i }));
				return { needChoice: { playerId: ctx.ownerId, choiceKind: 'handCard', key: KEY, options, ctx: { roll } } };
			}
			const [card] = owner.hand.splice(pick.handIndex, 1);
			if (!Array.isArray(owner.graveyard)) owner.graveyard = [];
			owner.graveyard.push(toGraveyardEntry(card.cardId ?? card, 'discarded'));
			return state;
		}
		if (roll === 6) {
			const { drawn, remaining } = drawCards(owner.deck, 2); // mid-turn: no reshuffle, empty deck draws nothing
			owner.deck = remaining;
			owner.hand.push(...drawn);
			return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 10, 'ABILITY');
		}
		return state;
	},
};
