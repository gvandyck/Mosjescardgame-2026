// Coert, KasteLuck - Morning Luck: at the start of your turn roll a die: 4-6 draw 1 card and this Mosje gains 5 MP.
// While a Tony Piecie stays for the owner, Morning Luck works on a 3-6. A mid-turn draw never reshuffles.
import { rollDie, drawCards } from '../../engine/deckEngine.js';
import { gainMP } from '../../engine/mpManager.js';

export const coertKasteLuckMorningLuck = {
	mosjeId: 'mosje_coert_kasteluck',
	run(state, ctx) {
		const roll = ctx.roll ?? rollDie(6);
		const owner = state.players[ctx.ownerId];
		const tony = (owner.piecieSlots || []).some(e => e?.stays === true && e.cardId === 'piecie_tony');
		if (roll < (tony ? 3 : 4)) return state;
		const { drawn, remaining } = drawCards(owner.deck, 1);
		owner.deck = remaining;
		owner.hand.push(...drawn);
		return gainMP(state, ctx.ownerId, ctx.holderSlotIndex, 5, 'ABILITY');
	},
};
