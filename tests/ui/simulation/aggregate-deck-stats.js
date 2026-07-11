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

export function aggregateDeckStats(records, deckIdToKey = {}) {
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

	// Bot-quality metrics: records carry per-game botMetrics keyed by deckId
	// (e.g. DUO_COERT_BINTI); deckIdToKey maps those onto the short keys.
	for (const r of records) {
		for (const [deckId, m] of Object.entries(r.botMetrics || {})) {
			const key = deckIdToKey[deckId] || deckId;
			const d = decks[key];
			if (!d) continue;
			const b = (d._bot ??= {
				decisions: 0, attempts: 0, skips: 0, skipReasons: {},
				pSum: 0, pCount: 0, mpSum: 0, mpCount: 0, setupSum: 0,
				rolls: 0, rollSuccesses: 0, secondMosjePlays: 0,
			});
			b.decisions += m.decisions || 0;
			b.attempts += m.attempts || 0;
			b.skips += m.skips || 0;
			for (const [reason, count] of Object.entries(m.skipReasons || {})) {
				b.skipReasons[reason] = (b.skipReasons[reason] || 0) + count;
			}
			b.pSum += m.pSum || 0;
			b.pCount += m.pCount || 0;
			b.mpSum += m.mpSum || 0;
			b.mpCount += m.mpCount || 0;
			b.setupSum += m.setupSum || 0;
			b.rolls += m.rolls || 0;
			b.rollSuccesses += m.rollSuccesses || 0;
			b.secondMosjePlays += m.secondMosjePlays || 0;
		}
	}

	const pct = (n, total) => (total > 0 ? +((n / total) * 100).toFixed(1) : null);
	for (const d of Object.values(decks)) {
		d.winRate = pct(d.wins, d.games);
		d.avgTurns = +(d.turnsSum / d.games).toFixed(1);
		d.firstSeatWinRate = pct(d.firstWins, d.firstGames);
		d.secondSeatWinRate = pct(d.secondWins, d.secondGames);
		delete d.turnsSum;
		if (d._bot) {
			const b = d._bot;
			d.bot = {
				questDecisions: b.decisions,
				questAttempts: b.attempts,
				questSkips: b.skips,
				skipReasons: b.skipReasons,
				attemptRate: pct(b.attempts, b.attempts + b.skips),
				avgConfidence: b.pCount > 0 ? +(b.pSum / b.pCount).toFixed(2) : null,
				avgMpAtDecision: b.mpCount > 0 ? +(b.mpSum / b.mpCount).toFixed(1) : null,
				setupActsPerDecision: b.decisions > 0 ? +(b.setupSum / b.decisions).toFixed(2) : null,
				rollSuccessRate: pct(b.rollSuccesses, b.rolls),
				secondMosjePlays: b.secondMosjePlays,
				secondMosjePerGame: d.games > 0 ? +(b.secondMosjePlays / d.games).toFixed(2) : null,
			};
			delete d._bot;
		}
	}

	return { decks, pairings };
}
