// expandDeckToCardIds.js — Pure helper: expand a deck definition into the
// flat card-id multiset it contains. Duplicates are PRESERVED (a deck running
// 3x Kannetje Melk yields the id three times) so the collection grant in
// claimStarterDeck.js awards exact counts and the deck stays fully
// rebuildable in the deck builder.
//
// Order: mosjes, piecies, snellePiecies, places, quests.
// Missing sub-arrays are treated as empty. No Firebase, no mutation.

export function expandDeckToCardIds(deck) {
	return [
		...(deck?.mosjes ?? []),
		...(deck?.piecies ?? []),
		...(deck?.snellePiecies ?? []),
		...(deck?.places ?? []),
		...(deck?.quests ?? []),
	];
}
