// Martin, The Historian - Time Control (draw-step option): once per turn, instead of your normal draw, look at the top 5
// cards of any deck (either player's), put them back in any order and gain 15 MP. At the end of your turn, draw 2 cards
// (only on turns Time Control was used - see martinHistorianEndDraw). Holder text (Cless, The Teacher / Synergy Chamber):
// when it looks at your own deck you may put 1 of those 5 cards into your hand (choices.keepCardId).
// choices (flat, or under .timeControl): deck_owner (player id), order (new top-first order of the top N), keepCardId.
import { gainMP } from '../../engine/mpManager.js';
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';

const HOLDER = 'mosje_martin_historian';

export const martinHistorianTimeControl = {
	mosjeId: HOLDER,
	run(state, { playerId, choices = {} }) {
		const tc = choices.timeControl ?? choices;
		const ownerId = tc.deck_owner ?? tc.deckOwner ?? playerId;
		const owner = state.players[ownerId];
		if (!owner) return state;
		const slotIndex = state.players[playerId].activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === HOLDER);
		const n = Math.min(5, owner.deck.length);
		const order = tc.order ?? Array.from({ length: n }, (_, i) => i);
		const valid = order.length === n && [...order].sort((a, b) => a - b).every((v, i) => v === i);
		if (!valid) return state; // bad input: the normal draw happens instead
		const top = owner.deck.slice(0, n);
		let next = order.map(i => top[i]);
		if (tc.keepCardId && ownerId === playerId && isHolderTextActive(state, playerId, HOLDER)) {
			const k = next.findIndex(c => c.cardId === tc.keepCardId);
			if (k >= 0) owner.hand.push(...next.splice(k, 1));
		}
		owner.deck = [...next, ...owner.deck.slice(n)];
		state.players[playerId].activeSlots[slotIndex].timeControlTurn = state.turnNumber;
		const gained = gainMP(state, playerId, slotIndex, 15, 'ABILITY');
		return { state: gained, replacesDraw: true };
	},
};
