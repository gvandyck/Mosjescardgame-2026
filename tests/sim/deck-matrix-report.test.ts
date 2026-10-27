// @ts-nocheck
// Phase 64-06: the 2.0 deck-matrix report pipeline, pure parts only (no game is played here).
// D-26: the ONLY things that fail a sim run are a crash and a timeout rate of 25 % or more.
// D-27: everything else (win rates, rounds, attack share, sanity vs desk sim) is report only and never asserts.
import { describe, it, expect } from 'vitest';
import { summarizeBotMetrics } from '../ui/simulation/game-collector.js';
import { aggregateDeckStats } from '../ui/simulation/aggregate-deck-stats.js';
import { buildSanityChecks } from '../ui/simulation/build-sanity-checks.js';
import { evaluateSimGate } from '../ui/simulation/evaluate-sim-gate.js';
import { buildSimRecord } from '../ui/simulation/build-sim-record.js';
import { buildDeckMatrixMarkdown } from '../ui/simulation/build-deck-matrix-markdown.js';

const TAKSEN = 'EXAMPLE_TAKSEN';
const REGELAARS = 'EXAMPLE_REGELAARS';
const deckIdToKey = { EXAMPLE_TAKSEN: 'TK', EXAMPLE_REGELAARS: 'RG', EXAMPLE_CREATIEVELINGEN: 'CV' };

const zero = { attacks: 0, questRolls: 0, questWins: 0, actionSkips: 0, skipReasons: {}, reactionsPlayed: 0, secondMosjePlays: 0, eliminationStrikes: 0, engineRefused: 0 };
const m = (over) => ({ ...zero, ...over });

// 6 records: 3 finished non-mirror, 1 finished mirror, 1 round-cap timeout, 1 crash.
function fixture() {
	const base = { crashed: false, errors: [], engineRefused: 0, timedOut: false, timeoutKind: null, elapsedMs: 1000, botMetrics: {} };
	return [
		{ ...base, matchup: 'TK-vs-RG', p1Deck: 'TK', p2Deck: 'RG', gameIndex: 1, seed: 64001, finished: true, rounds: 10, winReason: 'LEVEL_3', winnerId: 'player_1', winnerDeck: 'TK',
			botMetrics: { [TAKSEN]: m({ attacks: 6, questRolls: 2, questWins: 1 }), [REGELAARS]: m({ attacks: 2, questRolls: 2, questWins: 2, secondMosjePlays: 1 }) } },
		{ ...base, matchup: 'TK-vs-RG', p1Deck: 'TK', p2Deck: 'RG', gameIndex: 2, seed: 64002, finished: true, rounds: 20, winReason: 'KNOCKOUT', winnerId: 'player_2', winnerDeck: 'RG',
			botMetrics: { [TAKSEN]: m({ attacks: 4 }), [REGELAARS]: m({ questRolls: 4, questWins: 3, actionSkips: 2, skipReasons: { 'no-energy': 2 } }) } },
		{ ...base, matchup: 'RG-vs-TK', p1Deck: 'RG', p2Deck: 'TK', gameIndex: 1, seed: 64101, finished: true, rounds: 30, winReason: 'LEVEL_3', winnerId: 'player_1', winnerDeck: 'RG' },
		{ ...base, matchup: 'TK-vs-TK', p1Deck: 'TK', p2Deck: 'TK', gameIndex: 1, seed: 64201, finished: true, rounds: 40, winReason: 'LEVEL_3', winnerId: 'player_2', winnerDeck: 'TK' },
		{ ...base, matchup: 'CV-vs-TK', p1Deck: 'CV', p2Deck: 'TK', gameIndex: 1, seed: 64301, finished: false, timedOut: true, timeoutKind: 'rounds', rounds: 81, winReason: null, winnerId: null, winnerDeck: null },
		{ ...base, matchup: 'RG-vs-CV', p1Deck: 'RG', p2Deck: 'CV', gameIndex: 1, seed: 64401, finished: false, crashed: true, errors: ['console: boom'], rounds: 3, winReason: null, winnerId: null, winnerDeck: null },
	];
}

describe('summarizeBotMetrics (2.0 events)', () => {
	it('groups by deck and counts the 2.0 bot events, with UNKNOWN for events without a deck', () => {
		const out = summarizeBotMetrics([
			{ ev: 'attack', deck: TAKSEN, power: 3, final: 3 },
			{ ev: 'attack', deck: TAKSEN, power: 2, final: 1 },
			{ ev: 'quest-roll', deck: TAKSEN, quest: 'q1', dice: 2, success: true },
			{ ev: 'quest-roll', deck: TAKSEN, quest: 'q2', dice: 1, success: false },
			{ ev: 'action-skip', deck: TAKSEN, reason: 'no-energy' },
			{ ev: 'reaction-played', deck: TAKSEN, responderId: 'player_1', cardId: 'x' },
			{ ev: 'plays-second-mosje', deck: TAKSEN },
			{ ev: 'elimination-strike', knockout: true },
			{ ev: 'engine-refused', call: 'resolveReaction', cardId: null, error: 'nope' },
		]);
		expect(out[TAKSEN]).toEqual(m({ attacks: 2, questRolls: 2, questWins: 1, actionSkips: 1, skipReasons: { 'no-energy': 1 }, reactionsPlayed: 1, secondMosjePlays: 1 }));
		expect(out.UNKNOWN).toEqual(m({ eliminationStrikes: 1, engineRefused: 1 }));
	});
});

describe('aggregateDeckStats (D-27 report numbers)', () => {
	const stats = aggregateDeckStats(fixture(), deckIdToKey);

	it('overall: games, finished, timeouts by kind, crashes', () => {
		expect(stats.overall.games).toBe(6);
		expect(stats.overall.finished).toBe(4);
		expect(stats.overall.timeouts).toEqual({ count: 1, rate: 16.7, byKind: { rounds: 1 } });
		expect(stats.overall.crashes).toBe(1);
	});

	it('overall: median of [10,20,30,40] is 25, p90 is 40, win reasons and seat 1 share over finished games', () => {
		expect(stats.overall.medianRounds).toBe(25);
		expect(stats.overall.p90Rounds).toBe(40);
		expect(stats.overall.winReasons).toEqual({ LEVEL_3: 3, KNOCKOUT: 1 });
		expect(stats.overall.seat1WinRate).toBe(50);
	});

	it('overall: attackShare = attacks / (attacks + questRolls) * 100, 1 decimal', () => {
		expect(stats.overall.attackShare).toBe(60); // 12 attacks, 8 quest rolls
	});

	it('decks: win rate counts NON-mirror finished games only, with seat 1 / seat 2 splits', () => {
		const tk = stats.decks.TK;
		const rg = stats.decks.RG;
		expect([tk.games, tk.wins, tk.losses, tk.winRate]).toEqual([3, 1, 2, 33.3]);
		expect([tk.seat1WinRate, tk.seat2WinRate]).toEqual([50, 0]);
		expect([rg.games, rg.wins, rg.winRate]).toEqual([3, 2, 66.7]);
		expect([rg.seat1WinRate, rg.seat2WinRate]).toEqual([100, 50]);
		expect(stats.decks.CV.games).toBe(0);
		expect(stats.decks.CV.winRate).toBeNull();
	});

	it('decks: bot quality is mapped through deckIdToKey', () => {
		expect(stats.decks.TK.bot.attacks).toBe(10);
		expect(stats.decks.TK.bot.attackShare).toBe(83.3);
		expect(stats.decks.RG.bot.questRolls).toBe(6);
		expect(stats.decks.RG.bot.questWinRate).toBe(83.3);
		expect(stats.decks.RG.bot.skipReasons).toEqual({ 'no-energy': 2 });
	});

	it("matchups are keyed 'TK-vs-RG' with p1Wins / p2Wins / timeouts / crashes (mirrors included)", () => {
		expect(stats.matchups['TK-vs-RG']).toMatchObject({ games: 2, p1Wins: 1, p2Wins: 1, timeouts: 0, crashes: 0 });
		expect(stats.matchups['RG-vs-TK']).toMatchObject({ games: 1, p1Wins: 1, p2Wins: 0 });
		expect(stats.matchups['TK-vs-TK']).toMatchObject({ games: 1, p1Wins: 0, p2Wins: 1 });
		expect(stats.matchups['CV-vs-TK']).toMatchObject({ timeouts: 1 });
		expect(stats.matchups['RG-vs-CV']).toMatchObject({ crashes: 1 });
	});

	it('an empty record list gives zeros and nulls, not NaN', () => {
		const empty = aggregateDeckStats([], deckIdToKey);
		expect(empty.overall).toMatchObject({ games: 0, finished: 0, crashes: 0, medianRounds: null, seat1WinRate: null, attackShare: null });
		expect(empty.overall.timeouts.rate).toBe(0);
	});
});

describe('buildSanityChecks (report only, D-27)', () => {
	it("flags median rounds outside 10-20 as 'check for a rules bug' and keeps attack share and seat 1 'in line'", () => {
		const rows = buildSanityChecks({ medianRounds: 22, attackShare: 75.4, seat1WinRate: 52.2 });
		expect(rows.map(r => r.metric)).toEqual(['median rounds', 'attack share %', 'seat 1 win rate %']);
		expect(rows[0]).toMatchObject({ value: 22, desk: 15, low: 10, high: 20, flagged: true, note: 'check for a rules bug' });
		expect(rows[1]).toMatchObject({ desk: 74, low: 64, high: 84, flagged: false, note: 'in line' });
		expect(rows[2]).toMatchObject({ desk: 55, low: 45, high: 65, flagged: false, note: 'in line' });
	});

	it('a missing number is not flagged (nothing to compare)', () => {
		const rows = buildSanityChecks({ medianRounds: null, attackShare: null, seat1WinRate: null });
		expect(rows.every(r => r.flagged === false)).toBe(true);
	});
});

describe('evaluateSimGate (D-26: only crashes and a timeout rate of 25 % or more fail the run)', () => {
	const base = { crashed: false, errors: [], timedOut: false, finished: true };
	const games = (n, over = {}) => Array.from({ length: n }, (_, i) => ({ ...base, matchup: 'TK-vs-RG', gameIndex: i + 1, seed: 100 + i, ...over }));

	it('passes with every game recorded, 0 crashes and 0 timeouts', () => {
		expect(evaluateSimGate(games(10), { expectedGames: 10 })).toMatchObject({ passed: true, crashes: [], timeoutRate: 0, recorded: 10, expected: 10 });
	});

	it('lists a crash with matchup, game, seed and first error, and fails', () => {
		const recs = [...games(9), { ...base, matchup: 'RG-vs-CV', gameIndex: 4, seed: 64404, crashed: true, errors: ['console: boom', 'x'] }];
		const gate = evaluateSimGate(recs, { expectedGames: 10 });
		expect(gate.passed).toBe(false);
		expect(gate.crashes).toEqual([{ matchup: 'RG-vs-CV', gameIndex: 4, seed: 64404, firstError: 'console: boom' }]);
	});

	it('a timeout rate of exactly 25 % fails, 24 % passes', () => {
		const timed = { timedOut: true, finished: false, timeoutKind: 'rounds' };
		const at25 = [...games(3), ...games(1, timed)];
		expect(evaluateSimGate(at25, { expectedGames: 4 })).toMatchObject({ timeoutRate: 25, passed: false });
		const at24 = [...games(19), ...games(6, timed)]; // 6 of 25
		expect(evaluateSimGate(at24, { expectedGames: 25 })).toMatchObject({ timeoutRate: 24, passed: true });
	});

	it('a lost record (fewer games than expected) fails the gate', () => {
		const gate = evaluateSimGate(games(8), { expectedGames: 10 });
		expect(gate).toMatchObject({ passed: false, recorded: 8, expected: 10 });
	});

	it('names the first engine-refused or invalid-win-reason problem when there is no error text', () => {
		const refused = evaluateSimGate([{ ...base, matchup: 'A-vs-B', gameIndex: 1, seed: 1, crashed: true, engineRefused: 2 }], { expectedGames: 1 });
		expect(refused.crashes[0].firstError).toBe('engine-refused x2');
		const bad = evaluateSimGate([{ ...base, matchup: 'A-vs-B', gameIndex: 1, seed: 1, crashed: true, winReason: 'QUEST_MASTER' }], { expectedGames: 1 });
		expect(bad.crashes[0].firstError).toBe('invalid win reason QUEST_MASTER');
	});
});

describe('buildSimRecord (what counts as a crash, D-26)', () => {
	const meta = { matchup: 'TK-vs-RG', p1: { key: 'TK' }, p2: { key: 'RG' }, gameIndex: 3, seed: 64003 };
	const ok = { finished: true, timedOut: false, timeoutKind: null, rounds: 22, winReason: 'LEVEL_3', winnerId: 'player_2', errors: [], engineRefused: 0, stuckMs: 0, elapsedMs: 5000,
		metrics: [{ ev: 'attack', deck: TAKSEN }, { ev: 'quest-roll', deck: TAKSEN, success: true }] };

	it('a clean finished game is not a crash; winnerDeck is the seat key of winnerId; metrics are summarised', () => {
		const rec = buildSimRecord(meta, ok);
		expect(rec).toMatchObject({ matchup: 'TK-vs-RG', p1Deck: 'TK', p2Deck: 'RG', gameIndex: 3, seed: 64003, crashed: false, winnerDeck: 'RG', rounds: 22 });
		expect(rec.botMetrics[TAKSEN]).toMatchObject({ attacks: 1, questRolls: 1, questWins: 1 });
	});

	it('a round-cap timeout is a timeout, not a crash', () => {
		const rec = buildSimRecord(meta, { ...ok, finished: false, timedOut: true, timeoutKind: 'rounds', winReason: null, winnerId: null });
		expect(rec).toMatchObject({ crashed: false, timedOut: true, timeoutKind: 'rounds', winnerDeck: null });
	});

	it('a page or console error, an engine-refused metric and a V4 win reason are each a crash', () => {
		expect(buildSimRecord(meta, { ...ok, errors: ['console: boom'] }).crashed).toBe(true);
		expect(buildSimRecord(meta, { ...ok, engineRefused: 1 }).crashed).toBe(true);
		expect(buildSimRecord(meta, { ...ok, winReason: 'QUEST_MASTER' }).crashed).toBe(true);
		expect(buildSimRecord(meta, { ...ok, winReason: 'KNOCKOUT' }).crashed).toBe(false);
	});

	it('a thrown harness error becomes a crashed record carrying the message', () => {
		const rec = buildSimRecord(meta, null, new Error('page closed'));
		expect(rec).toMatchObject({ crashed: true, finished: false, timedOut: false });
		expect(rec.errors[0]).toContain('page closed');
	});

	it('a game that neither finished nor timed out is a crash too', () => {
		const rec = buildSimRecord(meta, { ...ok, finished: false, winReason: null, winnerId: null });
		expect(rec.crashed).toBe(true);
		expect(rec.errors.length).toBeGreaterThan(0);
	});
});

describe('buildDeckMatrixMarkdown', () => {
	function report(records, gateOver = {}) {
		const stats = aggregateDeckStats(records, deckIdToKey);
		const gate = { ...evaluateSimGate(records, { expectedGames: records.length }), ...gateOver };
		return {
			generatedAt: '2026-10-27T00:00:00.000Z',
			caps: { roundCap: 80, wallClockMs: 120000, pollMs: 500, stuckWindowMs: 5000 },
			seedBase: 64000, gamesPerMatchup: 1, expectedGames: records.length,
			gate, deckOrder: ['TK', 'RG', 'CV'],
			deckNames: { TK: 'Taksen', RG: 'Regelaars', CV: 'Creatievelingen' },
			stats, sanity: buildSanityChecks(stats.overall),
		};
	}

	it('renders every section, the caps and a PASS verdict', () => {
		const clean = fixture().slice(0, 4);
		const md = buildDeckMatrixMarkdown(report(clean));
		for (const h of ['## Gate (D-26)', '## Decks (non-mirror games)', '## Ordered matchups', '## Game shape', '## Bot quality', '## Sanity vs desk sim (report only)']) {
			expect(md).toContain(h);
		}
		expect(md).toContain('round 80');
		expect(md).toContain('120 s');
		expect(md).toContain('PASS');
		expect(md).toContain('4/4');
	});

	it('shows a FAIL verdict with the crash seed and first error, and never mentions the V4 win reasons', () => {
		const md = buildDeckMatrixMarkdown(report(fixture()));
		expect(md).toContain('FAIL');
		expect(md).toContain('64401');
		expect(md).toContain('console: boom');
		expect(md).not.toMatch(/QUEST_MASTER|MOMENTUM_DOMINATION/);
	});

	it('ordered matchups: rows = seat 1 deck, columns = seat 2 deck, cell = seat-1 wins - seat-2 wins', () => {
		const md = buildDeckMatrixMarkdown(report(fixture()));
		const row = md.split('\n').find(l => l.startsWith('| **TK**') && l.includes('1 - 1'));
		expect(row).toBeTruthy(); // TK (seat 1) vs RG (seat 2): 1 - 1
	});
});
