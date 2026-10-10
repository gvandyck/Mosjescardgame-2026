// playerFacingDecks.js — Single source of truth for the decks players may see.
// The onboarding modal, guest lobby dropdown, and bot deck pool ALL read from
// this accessor so the player-facing list can never drift between surfaces.
//
// Obby 2.0: only the 3 Example Decks (Taksen, Regelaars, Creatievelingen) are
// player-facing. The 5 duo decks and the 3 original decks stay in STARTER_DECKS
// as disabled data (raw ids still resolve for tests/seeded games) but are never
// shown to players or picked by the bot.

import { STARTER_DECKS } from './starterDecks.js';

const PLAYER_FACING_DECK_IDS = [
	'EXAMPLE_TAKSEN',
	'EXAMPLE_REGELAARS',
	'EXAMPLE_CREATIEVELINGEN',
];

// Returns the full deck definitions for the 3 Example Decks, in STARTER_DECKS order.
export function getPlayerFacingDecks() {
	return STARTER_DECKS.filter(deck => PLAYER_FACING_DECK_IDS.includes(deck.id) && !deck.disabled);
}
