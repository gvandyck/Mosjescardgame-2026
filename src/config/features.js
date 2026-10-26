// features.js — which hidden features are switched on (pure data, D-12).
// Slice A (the first 2.0 release) keeps the code of every hidden feature in the repo but shows none of it.
// Phase 67 (online rooms, accounts) and slice 2.0-C (store, deck builder, leaderboard, Munten rewards)
// flip a flag here instead of rewriting the lobby (D-15).
export const FEATURES = Object.freeze({
	onlineRooms: false,
	accounts: false,
	store: false,
	deckBuilder: false,
	leaderboard: false,
	muntenRewards: false,
});
