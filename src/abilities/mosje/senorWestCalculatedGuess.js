// Martin, Senor West - Calculated Guess: once per turn, name a card type (Mosje, Piecie, Snelle or Place - no Quest),
// then reveal the top card of any deck (either player's) and put it back. Correct: draw 2 cards and gain 10 MP.
// Wrong: lose 10 MP (loss funnel). Free to use (no Energy). Inputs: _pendingTargets.card_type, .deck_owner.
// The revealed card stays on top; an empty deck reveals nothing and nothing happens.
import { gainMP } from '../../engine/mpManager.js';
import { drawCards } from '../../engine/deckEngine.js';
import { applyMpLossToSlot } from '../../engine/mp/applyMpLossToSlot.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const TYPES = ['MOSJE', 'PIECIE', 'SNELLE', 'PLACE'];

export function senorWestCalculatedGuess(gameState, playerId, mosjeId = 'mosje_martin_senor_west') {
	let state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Senor West is not on the field');
	const targets = state._pendingTargets || {};
	const guess = String(targets.card_type ?? '').toUpperCase();
	if (!TYPES.includes(guess)) throw new Error('Name a card type: Mosje, Piecie, Snelle or Place');
	const owner = state.players[targets.deck_owner ?? playerId];
	if (!owner) throw new Error('Unknown deck owner');
	delete targets.card_type; delete targets.deck_owner;
	const top = owner.deck[0];
	if (!top) return state;
	const rawType = toGraveyardEntry(top.cardId ?? top, 'x').type;
	const type = rawType === 'SNELLE_PIECIE' ? 'SNELLE' : rawType;
	if (type === guess) {
		const { drawn, remaining } = drawCards(player.deck, 2);
		player.deck = remaining;
		player.hand.push(...drawn);
		return gainMP(state, playerId, slotIndex, 10, 'ABILITY');
	}
	applyMpLossToSlot({ state, playerId, slot: player.activeSlots[slotIndex], amount: 10, source: 'ABILITY' });
	return state;
}
