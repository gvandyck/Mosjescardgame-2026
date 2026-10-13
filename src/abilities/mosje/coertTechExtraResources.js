// Coert, The Hawaiian Tech Savant — Extra Resources: during your draw, pay 1 Energy to draw 1 extra card
// (up to 2 times per turn). A draw-step option (see finishDrawStep); choices.extra = how many (1-2).
// Energy is paid per card actually drawn, so an empty deck costs nothing.
import { drawCards } from '../../engine/deckEngine.js';
import { payEnergy } from '../../engine/energy/payEnergy.js';

const MAX_EXTRA = 2;

export const coertTechExtraResources = {
	mosjeId: 'mosje_coert_tech',
	available(state, playerId) {
		return (state.players[playerId]?.energy ?? 0) >= 1;
	},
	run(state, { playerId, choices = {} }) {
		const player = state.players[playerId];
		const want = Math.min(MAX_EXTRA, Math.max(1, Number(choices.extra) || 1), player.energy);
		const { drawn, remaining } = drawCards(player.deck, want);
		if (!drawn.length) return state;
		player.deck = remaining;
		player.hand.push(...drawn);
		payEnergy(state, playerId, drawn.length);
		return state;
	},
};
