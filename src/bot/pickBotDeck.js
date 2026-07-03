// pickBotDeck.js — ONBOARD-06: pure true-random bot/opponent deck picker.
// Mirror allowed (the player's own deck id is never excluded from the pool —
// callers pass the full player-facing pool). Every call site feeds
// getPlayerFacingDecks(), so the bot can only ever land on one of the 5 duo
// decks, never an original.

export function pickBotDeck(decks) {
	if (!Array.isArray(decks) || decks.length === 0) return null;
	const index = Math.floor(Math.random() * decks.length);
	return decks[index];
}
