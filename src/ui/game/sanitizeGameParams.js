// sanitizeGameParams.js — the game-page URL params that pick a seat or a deck, made safe (D-17, T-64-21).
// ?player= only ever means player_1 or player_2; ?deck1= / ?deck2= only a known deck id. Anything else becomes null,
// so the caller falls back to today's default (no "Unknown deckId" crash from a crafted URL).
const SEATS = ['player_1', 'player_2'];

export function sanitizeGameParams(urlParams, knownDeckIds) {
	const seat = urlParams.get('player');
	const deck = name => {
		const id = urlParams.get(name);
		return knownDeckIds.includes(id) ? id : null;
	};
	return {
		player: SEATS.includes(seat) ? seat : null,
		deck1: deck('deck1'),
		deck2: deck('deck2'),
	};
}
