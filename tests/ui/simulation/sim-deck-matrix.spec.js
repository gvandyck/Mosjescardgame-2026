/**
 * sim-deck-matrix.spec.js — Round-robin deck balance simulation.
 *
 * Every player-facing duo deck fights every other one, GAMES_PER_PAIRING
 * times (default 10), with the game's own smart bot driving BOTH sides
 * (?botvsbot=true). Seat-mirrored: the first half of each pairing's games
 * puts deck A in player_1 (goes first), the second half deck B — so
 * first-player advantage cancels out of the deck stats.
 *
 * 5 decks → 10 pairings × 10 games = 100 games.
 *
 * Outputs (written in afterAll, so partial runs still report):
 *   tests/ui/simulation/sim-deck-matrix-report.json  — all records + stats
 *   tests/ui/simulation/sim-deck-matrix-results.md   — leaderboard + matrix
 *
 * Run: npm run test:sim -- tests/ui/simulation/sim-deck-matrix.spec.js
 * Smoke (1 game per pairing): set GAMES_PER_PAIRING=1 first.
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ss } from '../helpers.js';
import { attachCollector, buildGameRecord } from './game-collector.js';
import { aggregateDeckStats } from './aggregate-deck-stats.js';
import { buildDeckMatrixMarkdown } from './build-deck-matrix-markdown.js';

// The 5 player-facing duo decks (mirrors playerFacingDecks.js — keys are
// short labels for tables/logs). Adding a 6th deck = one line here.
const DECKS = [
	{ key: 'CB', id: 'DUO_COERT_BINTI',     name: 'Coert & Binti' },
	{ key: 'GM', id: 'DUO_GANDOE_MICHELLE', name: 'Gandoe & Michelle' },
	{ key: 'CY', id: 'DUO_CHRIS_YOURI',     name: 'Chris & Youri' },
	{ key: 'JA', id: 'DUO_JISCA_ALYSSA',    name: 'Jisca & Alyssa' },
	{ key: 'WC', id: 'DUO_WEST_CLESS',      name: 'West & Cless' },
];

const GAMES_PER_PAIRING = Number(process.env.GAMES_PER_PAIRING) || 10;
const WIN_REASONS = new Set(['LEVEL_3', 'KNOCKOUT', 'QUEST_MASTER', 'MOMENTUM_DOMINATION']);

// All unordered pairings: 5 decks → 10.
const PAIRINGS = [];
for (let i = 0; i < DECKS.length; i++) {
	for (let j = i + 1; j < DECKS.length; j++) {
		PAIRINGS.push({ a: DECKS[i], b: DECKS[j], label: `${DECKS[i].key}-vs-${DECKS[j].key}` });
	}
}

const allRecords = [];

/** Block Firebase so the game runs in LOCAL mode, then open bot-vs-bot. */
async function gotoBotVsBot(page, deck1, deck2) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	const url = `/game?botvsbot=true&fast=true&deck1=${deck1}&deck2=${deck2}&testMode=true`;
	await page.goto(url);
	await page.waitForSelector('.mosje-card--owned, .mosje-card--opponent', { timeout: 20000 });
}

for (const pairing of PAIRINGS) {
	for (let gameIndex = 1; gameIndex <= GAMES_PER_PAIRING; gameIndex++) {
		// Seat mirror: first half A goes first, second half B goes first.
		const aFirst = gameIndex <= Math.ceil(GAMES_PER_PAIRING / 2);
		const p1 = aFirst ? pairing.a : pairing.b;
		const p2 = aFirst ? pairing.b : pairing.a;

		test(`deckmatrix: ${pairing.label} game ${gameIndex}/${GAMES_PER_PAIRING} (P1=${p1.key})`, async ({ page }) => {
			test.setTimeout(150000);

			const collector = attachCollector(page);
			await gotoBotVsBot(page, p1.id, p2.id);

			// The bot loop self-drives to completion — wait for the end screen.
			await page.waitForSelector('#reward-overlay', { timeout: 120000 });
			await ss(page, `deckmatrix-${pairing.label}-g${gameIndex}`);

			const record = await buildGameRecord(page, collector, {
				pairing: pairing.label,
				p1Deck: p1.key,
				p2Deck: p2.key,
				gameIndex,
			});

			// Prefer the authoritative winnerId from the engine state over the
			// overlay-title heuristic in buildGameRecord.
			const winnerId = await page.evaluate(
				() => window.__testHooks?.getGameState?.()?.winnerId ?? null
			);
			if (winnerId === 'player_1' || winnerId === 'player_2') {
				record.winner = winnerId;
				record.outcome = winnerId === 'player_1' ? 'win' : 'loss';
			}
			record.winnerDeck = record.winner === 'player_1' ? p1.key : p2.key;
			allRecords.push(record);

			expect(collector.getErrors(), 'No page errors').toHaveLength(0);
			expect(WIN_REASONS.has(record.winReason),
				`Win reason "${record.winReason}" must be valid`).toBe(true);

			console.log(
				`  ${pairing.label} G${gameIndex}: ${record.winnerDeck} won (${record.winReason}) ` +
				`~${record.turnCount} turns | P1=${p1.key}`
			);
		});
	}
}

test.afterAll(() => {
	if (allRecords.length === 0) return;

	const deckIdToKey = Object.fromEntries(DECKS.map(d => [d.id, d.key]));
	const stats = aggregateDeckStats(allRecords, deckIdToKey);
	const expectedGames = PAIRINGS.length * GAMES_PER_PAIRING;

	const report = {
		generatedAt: new Date().toISOString(),
		mode: 'deck-matrix-bot-vs-bot',
		gamesPerPairing: GAMES_PER_PAIRING,
		expectedGames,
		completedGames: allRecords.length,
		failedGames: expectedGames - allRecords.length,
		deckOrder: DECKS.map(d => d.key),
		deckNames: Object.fromEntries(DECKS.map(d => [d.key, `${d.key} ${d.name}`])),
		stats,
		allGames: allRecords,
	};

	const outDir = join(process.cwd(), 'tests', 'ui', 'simulation');
	mkdirSync(outDir, { recursive: true });
	writeFileSync(join(outDir, 'sim-deck-matrix-report.json'), JSON.stringify(report, null, 2));
	writeFileSync(join(outDir, 'sim-deck-matrix-results.md'), buildDeckMatrixMarkdown(report));
	console.log('\n📊 Deck matrix report → tests/ui/simulation/sim-deck-matrix-report.json');
	console.log('📊 Results table    → tests/ui/simulation/sim-deck-matrix-results.md');

	console.log('\n── Deck Leaderboard ──');
	const ranked = Object.entries(stats.decks).sort((a, b) => b[1].winRate - a[1].winRate);
	for (const [key, d] of ranked) {
		console.log(`  ${key}: ${d.wins}W–${d.losses}L (${d.winRate}%) | ` +
			`1st seat ${d.firstSeatWinRate}% / 2nd seat ${d.secondSeatWinRate}% | avg ${d.avgTurns} turns`);
	}
});
