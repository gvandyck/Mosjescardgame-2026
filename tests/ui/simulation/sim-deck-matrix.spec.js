/**
 * sim-deck-matrix.spec.js - the 2.0 deck-matrix simulation (Phase 64-06, D-23 / D-25 / D-26 / D-27).
 *
 * The 3 Example Decks play every ORDERED matchup (9 = 3 pairings in both seat orders + 3 mirrors), GAMES_PER_MATCHUP times
 * (default 10), the game's own bot driving BOTH seats (?botvsbot=true). 9 x 10 = 90 games + 1 gate test = 91 tests.
 * Seat 1 is the first named deck (testMode forces player_1 to go first), so the ordered pairs mirror the seats.
 *
 * GATE (the only thing that fails the run, D-26): any crash (page error, console error, bot-driver throw, engine-refused,
 * invalid win reason), a lost record, or a timeout rate of 25 % or more. A timeout = not finished by round 80 or 120 s
 * (tests/helpers/simCaps.js). Everything else is REPORT ONLY (D-27): the gate test writes
 *   tests/ui/simulation/sim-deck-matrix-report.json   all games + stats + sanity rows
 *   tests/ui/simulation/sim-deck-matrix-results.md    the human-readable report
 * Balancing is parked; never turn a report number into an assertion.
 *
 * Run:    npm run test:sim                         (headless "sim" project, workers 1)
 * Smoke:  GAMES_PER_MATCHUP=1 npm run test:sim     (9 games + gate)
 * Seeds:  SIM_SEED=<n> sets the base (default 64000); SIM_SEED=random leaves Math.random unseeded.
 *         game seed = base + matchupIndex * 100 + game number, so a failing game can be replayed alone.
 */
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { playBotGame } from '../../helpers/playBotGame.js';
import { SIM_CAPS } from '../../helpers/simCaps.js';
import { buildSimRecord } from './build-sim-record.js';
import { aggregateDeckStats } from './aggregate-deck-stats.js';
import { buildSanityChecks } from './build-sanity-checks.js';
import { evaluateSimGate, MAX_TIMEOUT_RATE } from './evaluate-sim-gate.js';
import { buildDeckMatrixMarkdown } from './build-deck-matrix-markdown.js';

// The 3 Example Decks (src/data/exampleDecks.js); keys are the short labels used in tables and logs.
const DECKS = [
	{ key: 'TK', id: 'EXAMPLE_TAKSEN', name: 'Taksen' },
	{ key: 'RG', id: 'EXAMPLE_REGELAARS', name: 'Regelaars' },
	{ key: 'CV', id: 'EXAMPLE_CREATIEVELINGEN', name: 'Creatievelingen' },
];

const GAMES_PER_MATCHUP = Number(process.env.GAMES_PER_MATCHUP) || 10;
const SEED_BASE = process.env.SIM_SEED === 'random' ? null : (Number(process.env.SIM_SEED) || 64000);

// All 9 ordered pairs (seat 1 deck, seat 2 deck), mirrors included.
const MATCHUPS = DECKS.flatMap(p1 => DECKS.map(p2 => ({ p1, p2, label: `${p1.key}-vs-${p2.key}` })));
const EXPECTED_GAMES = MATCHUPS.length * GAMES_PER_MATCHUP;

const records = [];

MATCHUPS.forEach((matchup, matchupIndex) => {
	for (let gameIndex = 1; gameIndex <= GAMES_PER_MATCHUP; gameIndex++) {
		const seed = SEED_BASE === null ? null : SEED_BASE + matchupIndex * 100 + gameIndex;
		test(`sim: ${matchup.label} game ${gameIndex}/${GAMES_PER_MATCHUP} (seed ${seed})`, async ({ page }) => {
			test.setTimeout(200000);
			const meta = { matchup: matchup.label, p1: matchup.p1, p2: matchup.p2, gameIndex, seed };
			let result = null;
			let thrown = null;
			try {
				result = await playBotGame(page, { deck1: matchup.p1.id, deck2: matchup.p2.id, seed });
			} catch (err) {
				thrown = err;
			}
			const record = buildSimRecord(meta, result, thrown);
			records.push(record);
			const how = record.crashed ? `CRASH ${record.errors[0] ?? 'engine-refused / bad win reason'}`
				: record.timedOut ? `TIMEOUT (${record.timeoutKind})` : `${record.winnerDeck} won by ${record.winReason}`;
			console.log(`  ${matchup.label} G${gameIndex} (seed ${seed}): ${how}, ${record.rounds} rounds, ${(record.elapsedMs / 1000).toFixed(1)} s`);
		});
	}
});

test('sim gate: 0 crashes and timeout rate under 25% (D-26)', () => {
	const gate = evaluateSimGate(records, { expectedGames: EXPECTED_GAMES });
	const stats = aggregateDeckStats(records, Object.fromEntries(DECKS.map(d => [d.id, d.key])));
	const report = {
		generatedAt: new Date().toISOString(),
		mode: '2.0-deck-matrix-bot-vs-bot',
		caps: SIM_CAPS,
		seedBase: SEED_BASE,
		gamesPerMatchup: GAMES_PER_MATCHUP,
		expectedGames: EXPECTED_GAMES,
		gate,
		deckOrder: DECKS.map(d => d.key),
		deckNames: Object.fromEntries(DECKS.map(d => [d.key, d.name])),
		stats,
		sanity: buildSanityChecks(stats.overall),
		allGames: records,
	};
	const outDir = join(process.cwd(), 'tests', 'ui', 'simulation');
	mkdirSync(outDir, { recursive: true });
	writeFileSync(join(outDir, 'sim-deck-matrix-report.json'), JSON.stringify(report, null, 2));
	writeFileSync(join(outDir, 'sim-deck-matrix-results.md'), buildDeckMatrixMarkdown(report));
	console.log(`\nSim report: ${gate.recorded}/${gate.expected} games, ${gate.crashes.length} crashes, timeout rate ${gate.timeoutRate}%`);
	console.log('Written: tests/ui/simulation/sim-deck-matrix-report.json + sim-deck-matrix-results.md');

	expect(records.length, 'every game must be recorded (fewer means a worker restart lost records)').toBe(EXPECTED_GAMES);
	expect(gate.crashes, 'crashed games (seed + first error)').toEqual([]);
	expect(gate.timeoutRate, `timeout rate must stay under ${MAX_TIMEOUT_RATE}%`).toBeLessThan(MAX_TIMEOUT_RATE);
});
