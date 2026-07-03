// claimStarterDeck.js — One-time starter-deck claim for onboarding.
// Performs, in order:
//   1. saveDeck(uid, deck)              — deck stored under users/{uid}/decks/{id}
//   2. setActiveDeckId(uid, deck.id)    — profile.activeDeckId points at it
//   3. addCardsToCollection(exact multiset) — EXACT counts (3x where the deck
//      runs 3) so the deck is fully rebuildable in the deck builder.
//      NOT seedCollection (which only grants 1 of each unique card).

import { saveDeck, setActiveDeckId } from './userStore.js';
import { addCardsToCollection } from './collectionStore.js';
import { expandDeckToCardIds } from './expandDeckToCardIds.js';

export async function claimStarterDeck(uid, deck) {
	if (!uid || !deck?.id) {
		return { success: false, error: 'Missing user or deck.' };
	}
	const saved = await saveDeck(uid, deck);
	if (!saved?.success) {
		return { success: false, error: saved?.error ?? 'Could not save deck.' };
	}
	const activated = await setActiveDeckId(uid, deck.id);
	if (!activated?.success) {
		return { success: false, error: activated?.error ?? 'Could not set active deck.' };
	}
	const granted = await addCardsToCollection(uid, expandDeckToCardIds(deck));
	if (!granted?.success) {
		return { success: false, error: 'Could not grant starter cards.' };
	}
	return { success: true };
}
