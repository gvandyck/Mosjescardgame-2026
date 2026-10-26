// resolveDeckChoice.js — turn a lobby deck choice into a real deck id (D-08, D-20).
// RANDOM is rolled through pickBotDeck (mirror allowed) every time it is called, so Play again can roll it again.
// Anything that is not a player-facing deck id falls back to the first deck.
import { pickBotDeck } from '../../bot/pickBotDeck.js';
import { RANDOM_DECK_CHOICE } from '../../config/lobbyModes.js';

export function resolveDeckChoice(choice, decks, pick = pickBotDeck) {
	if (choice === RANDOM_DECK_CHOICE) return pick(decks).id;
	if (decks.some(deck => deck.id === choice)) return choice;
	return decks[0].id;
}
