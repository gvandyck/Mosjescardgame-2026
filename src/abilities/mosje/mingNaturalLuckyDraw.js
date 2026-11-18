// Ming, The Natural — Lucky Draw (2.1): pay 1 Energy (useMosjeAbility), once per turn: reveal the top card of your deck
// to both players and draw it. Nothing else happens for a card that is not a Piecie. A Piecie that may be activated now
// opens the owner's pause through the private hook 'mingActivate' (mingActivateChoice.js): activate it for 0 Energy
// (as if ready) or keep it. Refused (throws, nothing paid) when Ming is not on the field or the deck is empty.
import { runTriggerJobs } from '../../engine/mosje/runTriggerJobs.js';
import { revealCards } from '../../engine/hidden/revealCards.js';

export function mingNaturalLuckyDraw(gameState, playerId, mosjeId = 'mosje_ming_natural') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Ming, The Natural is not on the field');
	if (!player.deck.length) throw new Error('Your deck is empty');
	const card = player.deck.shift();
	player.hand.push(card);
	for (const id of Object.keys(state.players)) revealCards(state, id, 'ming_natural', [card.cardId]);
	return runTriggerJobs(state, 'mingActivate', [{ triggerIdx: 0, playerId, slotIndex }], 0, { playerId, cardId: card.cardId });
}
