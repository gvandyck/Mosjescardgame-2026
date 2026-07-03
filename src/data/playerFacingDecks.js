// playerFacingDecks.js — Single source of truth for the decks players may see.
// The onboarding modal, guest lobby dropdown, and bot deck pool ALL read from
// this accessor so the player-facing list can never drift between surfaces.
//
// Explicit whitelist (NOT a prefix match): only the 5 synergy duo decks are
// player-facing. The 3 originals (PHYSICAL_FORCE, DIGITAL_CONTROL,
// ARTISTIC_RHYTHM) stay in STARTER_DECKS untouched as bot/test fixtures but
// are never shown to players.

import { STARTER_DECKS } from './starterDecks.js';

const PLAYER_FACING_DECK_IDS = [
	'DUO_COERT_BINTI',
	'DUO_GANDOE_MICHELLE',
	'DUO_CHRIS_YOURI',
	'DUO_JISCA_ALYSSA',
	'DUO_WEST_CLESS',
];

// Returns the full deck definitions for the 5 duo decks, in STARTER_DECKS order.
export function getPlayerFacingDecks() {
	return STARTER_DECKS.filter(deck => PLAYER_FACING_DECK_IDS.includes(deck.id));
}
