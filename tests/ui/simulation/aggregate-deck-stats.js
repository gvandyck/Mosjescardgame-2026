/**
 * aggregate-deck-stats.js — Deck-centric aggregation for the deck-matrix sim.
 *
 * The existing aggregateRecords() in game-collector.js is seat-centric
 * (player_1 wins/losses). For a round-robin where every deck sits in both
 * seats, we need stats keyed by DECK: total win rate, first/second-seat win
 * rate, avg game length, and per-pairing head-to-head scores.
 *
 * Expects records that carry: p1Deck, p2Deck (deck keys), winnerDeck,
 * pairing (e.g. "CB-vs-GM"), winReason, turnCount.
 */

export function aggregateDeckStats(records) {
	const decks = {};
	const pairings = {};

	const ensureDeck = key => (decks[key] ??= {
		games: 0, wins: 0, losses: 0, turnsSum: 0,
		firstGames: 0, firstWins: 0, secondGames: 0, secondWins: 0,
		winReasons: {},
	});

	for (const r of records) {
		for (const [deckKey, isFirstSeat] of [[r.p1Deck, true], [r.p2Deck, false]]) {
			const d = ensureDeck(deckKey);
			const won = r.winnerDeck === deckKey;
			d.games++;
			d.turnsSum += r.turnCount;
			if (won) d.wins++; else d.losses++;
			if (isFirstSeat) {
				d.firstGames++;
				if (won) d.firstWins++;
			} else {
				d.secondGames++;
				if (won) d.secondWins++;
			}
			if (won) d.winReasons[r.winReason] = (d.winReasons[r.winReason] || 0) + 1;
		}

		const p = (pairings[r.pairing] ??= { games: 0, winsByDeck: {} });
		p.games++;
		p.winsByDeck[r.winnerDeck] = (p.winsByDeck[r.winnerDeck] || 0) + 1;
	}

	const pct = (n, total) => (total > 0 ? +((n / total) * 100).toFixed(1) : null);
	for (const d of Object.values(decks)) {
		d.winRate = pct(d.wins, d.games);
		d.avgTurns = +(d.turnsSum / d.games).toFixed(1);
		d.firstSeatWinRate = pct(d.firstWins, d.firstGames);
		d.secondSeatWinRate = pct(d.secondWins, d.secondGames);
		delete d.turnsSum;
	}

	return { decks, pairings };
}
