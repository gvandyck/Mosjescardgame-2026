/**
 * aggregate-deck-stats.js — aggregation for the 2.0 deck-matrix sim (64-06, D-23 / D-26 / D-27).
 *
 * Input records (one per game): { matchup, p1Deck, p2Deck, gameIndex, seed, finished, timedOut, timeoutKind, crashed,
 * errors, engineRefused, rounds, winReason, winnerId, winnerDeck, botMetrics, elapsedMs }; p1Deck / p2Deck are deck KEYS
 * ('TK'), botMetrics is keyed by deck ID (EXAMPLE_TAKSEN) and mapped through deckIdToKey.
 * Output: { overall, decks, matchups }. Overall and matchup numbers use every seat (mirrors included); the per-deck WIN rate
 * uses NON-mirror finished games only (a mirror cannot say which deck is better). Bot quality counts every game incl. mirrors.
 * Everything here is report only (D-27); the gate lives in evaluate-sim-gate.js.
 */

const COUNTERS = ['attacks', 'questRolls', 'questWins', 'actionSkips', 'reactionsPlayed', 'secondMosjePlays', 'eliminationStrikes', 'engineRefused'];
const pct = (n, total) => (total > 0 ? +((n / total) * 100).toFixed(1) : null);
const sortedRounds = recs => recs.map(r => r.rounds).sort((a, b) => a - b);
const hasWinner = r => r.finished && (r.winnerId === 'player_1' || r.winnerId === 'player_2');

function median(sorted) {
	if (sorted.length === 0) return null;
	const mid = sorted.length >> 1;
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function p90(sorted) { return sorted.length === 0 ? null : sorted[Math.ceil(0.9 * sorted.length) - 1]; } // nearest rank

function newBot() {
	return { ...Object.fromEntries(COUNTERS.map(c => [c, 0])), skipReasons: {} };
}

function addBot(into, m) {
	for (const c of COUNTERS) into[c] += m[c] || 0;
	for (const [reason, n] of Object.entries(m.skipReasons || {})) into.skipReasons[reason] = (into.skipReasons[reason] || 0) + n;
}

function finishBot(b, gamesPlayed) {
	return {
		...b, gamesPlayed,
		attackShare: pct(b.attacks, b.attacks + b.questRolls),
		questWinRate: pct(b.questWins, b.questRolls),
		secondMosjePerGame: gamesPlayed > 0 ? +(b.secondMosjePlays / gamesPlayed).toFixed(2) : null,
	};
}

function buildOverall(records) {
	const finished = records.filter(r => r.finished);
	const timedOut = records.filter(r => r.timedOut);
	const byKind = {};
	for (const r of timedOut) byKind[r.timeoutKind || 'unknown'] = (byKind[r.timeoutKind || 'unknown'] || 0) + 1;
	const bot = newBot();
	for (const r of records) for (const m of Object.values(r.botMetrics || {})) addBot(bot, m);
	const winReasons = {};
	for (const r of finished) winReasons[r.winReason] = (winReasons[r.winReason] || 0) + 1;
	const decided = finished.filter(hasWinner);
	const rounds = sortedRounds(finished);
	return {
		games: records.length,
		finished: finished.length,
		timeouts: { count: timedOut.length, rate: records.length ? +((timedOut.length / records.length) * 100).toFixed(1) : 0, byKind },
		crashes: records.filter(r => r.crashed).length,
		engineRefused: records.reduce((s, r) => s + (r.engineRefused || 0), 0),
		medianRounds: median(rounds),
		p90Rounds: p90(rounds),
		seat1WinRate: pct(decided.filter(r => r.winnerId === 'player_1').length, decided.length),
		attackShare: pct(bot.attacks, bot.attacks + bot.questRolls),
		winReasons,
	};
}

function buildMatchups(records) {
	const matchups = {};
	for (const r of records) {
		const x = (matchups[r.matchup] ??= { p1Deck: r.p1Deck, p2Deck: r.p2Deck, games: 0, finished: 0, p1Wins: 0, p2Wins: 0, timeouts: 0, crashes: 0, rounds: [] });
		x.games++;
		if (r.finished) { x.finished++; x.rounds.push(r.rounds); }
		if (hasWinner(r)) { if (r.winnerId === 'player_1') x.p1Wins++; else x.p2Wins++; }
		if (r.timedOut) x.timeouts++;
		if (r.crashed) x.crashes++;
	}
	for (const x of Object.values(matchups)) {
		x.medianRounds = median(x.rounds.sort((a, b) => a - b));
		delete x.rounds;
	}
	return matchups;
}

function buildDecks(records, deckIdToKey) {
	const decks = {};
	const ensure = key => (decks[key] ??= {
		games: 0, wins: 0, losses: 0, seat1Games: 0, seat1Wins: 0, seat2Games: 0, seat2Wins: 0,
		winReasons: {}, _rounds: [], _bot: newBot(), _seats: 0,
	});
	for (const r of records) {
		ensure(r.p1Deck)._seats++;
		ensure(r.p2Deck)._seats++;
		for (const [deckId, m] of Object.entries(r.botMetrics || {})) {
			const d = decks[deckIdToKey[deckId] || deckId];
			if (d) addBot(d._bot, m);
		}
		if (r.p1Deck === r.p2Deck || !hasWinner(r)) continue; // mirrors do not rank decks
		const winnerKey = r.winnerId === 'player_1' ? r.p1Deck : r.p2Deck;
		for (const [key, seat] of [[r.p1Deck, 1], [r.p2Deck, 2]]) {
			const d = decks[key];
			const won = key === winnerKey;
			d.games++; d._rounds.push(r.rounds);
			d[`seat${seat}Games`]++;
			if (won) { d.wins++; d[`seat${seat}Wins`]++; d.winReasons[r.winReason] = (d.winReasons[r.winReason] || 0) + 1; } else d.losses++;
		}
	}
	for (const d of Object.values(decks)) {
		d.winRate = pct(d.wins, d.games);
		d.seat1WinRate = pct(d.seat1Wins, d.seat1Games);
		d.seat2WinRate = pct(d.seat2Wins, d.seat2Games);
		d.medianRounds = median(d._rounds.sort((a, b) => a - b));
		d.bot = finishBot(d._bot, d._seats);
		delete d._rounds; delete d._bot; delete d._seats;
	}
	return decks;
}

export function aggregateDeckStats(records, deckIdToKey = {}) {
	return { overall: buildOverall(records), decks: buildDecks(records, deckIdToKey), matchups: buildMatchups(records) };
}
