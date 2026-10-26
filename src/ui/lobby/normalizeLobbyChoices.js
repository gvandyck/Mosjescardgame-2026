// normalizeLobbyChoices.js — the LobbyChoices contract: whatever comes in (form, stored prefs, replay record),
// exactly 7 safe keys come out (D-04, D-08, D-09, T-64-01).
import { RANDOM_DECK_CHOICE } from '../../config/lobbyModes.js';
import { getLobbyModes } from './getLobbyModes.js';
import { sanitizePlayerName } from './sanitizePlayerName.js';

export function normalizeLobbyChoices(raw, decks, modes = getLobbyModes()) {
	const input = raw !== null && typeof raw === 'object' ? raw : {};
	const deckIds = decks.map(deck => deck.id);
	const ownDeck = value => (deckIds.includes(value) ? value : deckIds[0]);
	const botDeck = value => (value === RANDOM_DECK_CHOICE || deckIds.includes(value) ? value : RANDOM_DECK_CHOICE);
	return {
		mode: modes.some(mode => mode.id === input.mode) ? input.mode : 'vsBot',
		name: sanitizePlayerName(input.name),
		deckChoice: ownDeck(input.deckChoice),
		botChoice: botDeck(input.botChoice),
		bot1Choice: botDeck(input.bot1Choice),
		bot2Choice: botDeck(input.bot2Choice),
		fast: input.fast === true,
	};
}
