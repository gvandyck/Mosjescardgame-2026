// resolveActiveDeck.js — Pure helper: pick the player's active deck from
// their saved decks.
//
// Rules:
//   - Return the deck whose id === activeDeckId, when found.
//   - If activeDeckId is missing or matches no deck but decks exist,
//     default to the FIRST saved deck (migration-safe for accounts
//     created before the activeDeckId profile field existed).
//   - Return null when there are no decks at all.

export function resolveActiveDeck(decks, activeDeckId) {
	if (!decks?.length) return null;
	return decks.find(deck => deck.id === activeDeckId) ?? decks[0];
}
