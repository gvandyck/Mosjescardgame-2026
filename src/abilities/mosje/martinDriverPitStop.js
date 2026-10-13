// Martin, The Precision Driver — Pit Stop: once per turn, pay 1 Energy (useMosjeAbility) and discard 2 cards from
// your hand: draw 3 cards and gain 10 MP. Input: state._pendingTargets.discard_cards = 2 hand indexes or card ids.
// Refused (throws, nothing spent) with fewer than 2 cards in hand or an invalid pick.
import { drawCards } from '../../engine/deckEngine.js';
import { gainMP } from '../../engine/mpManager.js';

export function martinDriverPitStop(gameState, playerId, mosjeId = 'mosje_martin_driver') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots?.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId);
	if (slotIndex === undefined || slotIndex < 0) throw new Error('Martin, The Precision Driver is not on the field');
	const picks = state._pendingTargets?.discard_cards;
	if (!Array.isArray(picks) || picks.length !== 2) throw new Error('Pit Stop needs 2 cards from your hand to discard');
	const indexes = [];
	for (const p of picks) {
		const i = Number.isInteger(p) ? p : player.hand.findIndex((c, ci) => c.cardId === p && !indexes.includes(ci));
		if (!player.hand[i] || indexes.includes(i)) throw new Error('Pit Stop discard is not in your hand');
		indexes.push(i);
	}
	delete state._pendingTargets.discard_cards;
	const gone = [];
	[...indexes].sort((a, b) => b - a).forEach(i => gone.push(...player.hand.splice(i, 1)));
	player.graveyard.push(...gone);
	const { drawn, remaining } = drawCards(player.deck, 3); // mid-turn: no reshuffle, an empty deck draws nothing
	player.deck = remaining;
	player.hand.push(...drawn);
	return gainMP(state, playerId, slotIndex, 10, 'ABILITY');
}
