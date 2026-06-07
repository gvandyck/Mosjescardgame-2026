/**
 * sim-30-games.spec.js — 10 games × 3 deck matchups = 30 full games.
 *
 * Each game is played by the auto-player (quest + piecie + end turn per turn).
 * Per-game data is collected from browser console logs.
 * A JSON report is written to tests/ui/simulation/sim-report.json after all runs.
 *
 * Run with: npx playwright test tests/ui/simulation/sim-30-games.spec.js --headed
 *
 * The test suite passes as long as:
 * - All 30 games complete without crashing
 * - Every game reaches a valid win condition
 * - Zero browser page errors across all 30 runs
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
	GAME_URL_TEST,
	seedOfflineSession,
	waitForBoard,
	ss,
} from '../helpers.js';
import { playAutoTurn } from './auto-player.js';
import { attachCollector, buildGameRecord, aggregateRecords } from './game-collector.js';

const MATCHUPS = [
	{ p1: 'PHYSICAL_FORCE',  p2: 'DIGITAL_CONTROL',  label: 'PF-vs-DC' },
	{ p1: 'DIGITAL_CONTROL', p2: 'ARTISTIC_RHYTHM',  label: 'DC-vs-AR' },
	{ p1: 'ARTISTIC_RHYTHM', p2: 'PHYSICAL_FORCE',   label: 'AR-vs-PF' },
];
const GAMES_PER_MATCHUP = 10;
const MAX_TURNS = 30;
const WIN_REASONS = new Set(['LEVEL_3', 'KNOCKOUT', 'QUEST_MASTER', 'MOMENTUM_DOMINATION']);

// Accumulate records across all test files sharing this run
const allRecords = [];

for (const matchup of MATCHUPS) {
	for (let gameIndex = 1; gameIndex <= GAMES_PER_MATCHUP; gameIndex++) {
		test(`sim: ${matchup.label} game ${gameIndex}/${GAMES_PER_MATCHUP}`, async ({ page }) => {
			test.setTimeout(180000);

			// NO mockDiceRoll — we want REAL randomness so each game plays differently.
			// (mockDiceRoll overrides ALL Math.random globally, which breaks deck shuffle
			//  and Mosje selection — value 1.0 produces out-of-bounds array indices.)
			// Statistical variety across 10 games is the whole point of the simulation.
			await seedOfflineSession(page, matchup.p1, matchup.p2);

			const collector = attachCollector(page);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);

			let turnCount = 0;
			let result = 'running';

			while (turnCount < MAX_TURNS && result === 'running') {
				turnCount++;
				const outcome = await playAutoTurn(page);
				if (outcome === 'gameover') result = 'gameover';
				if (outcome === 'timeout') result = 'timeout';
			}

			// Ensure reward overlay is present
			await page.waitForSelector('#reward-overlay', { timeout: 10000 });
			await ss(page, `sim-${matchup.label}-g${gameIndex}`);

			const record = await buildGameRecord(page, collector, {
				matchup: matchup.label,
				p1Deck: matchup.p1,
				p2Deck: matchup.p2,
				gameIndex,
			});
			allRecords.push(record);

			// ── Assertions ────────────────────────────────────────────────────

			// 1. No browser crashes
			expect(collector.getErrors(), 'No page errors').toHaveLength(0);

			// 2. Valid win reason
			expect(WIN_REASONS.has(record.winReason),
				`Win reason "${record.winReason}" must be one of: ${[...WIN_REASONS].join(', ')}`
			).toBe(true);

			// 3. Game ended before safety cap
			expect(record.turnCount, 'Game must end before 30-turn safety cap').toBeLessThan(MAX_TURNS);

			console.log(
				`  ${matchup.label} G${gameIndex}: ${record.outcome} (${record.winReason}) ` +
				`in ~${record.turnCount} turns | ` +
				`${record.questsAttempted} quests, ${record.pieciesActivated} piecies, ` +
				`${record.crashes} crashes`
			);
		});
	}
}

// ── Final summary test — writes report after all 30 games ────────────────────

test.afterAll(() => {
	if (allRecords.length === 0) return;

	const byMatchup = {};
	for (const r of allRecords) {
		if (!byMatchup[r.matchup]) byMatchup[r.matchup] = [];
		byMatchup[r.matchup].push(r);
	}

	const summaries = {};
	for (const [label, records] of Object.entries(byMatchup)) {
		summaries[label] = aggregateRecords(records);
	}

	const report = {
		generatedAt: new Date().toISOString(),
		totalGames: allRecords.length,
		gamesPerMatchup: GAMES_PER_MATCHUP,
		totalCrashes: allRecords.reduce((s, r) => s + r.crashes, 0),
		matchups: summaries,
		allGames: allRecords,
	};

	const outDir = join(process.cwd(), 'tests', 'ui', 'simulation');
	mkdirSync(outDir, { recursive: true });
	const outPath = join(outDir, 'sim-report.json');
	writeFileSync(outPath, JSON.stringify(report, null, 2));
	console.log(`\n📊 Simulation report written to ${outPath}`);

	// Print a quick summary table
	console.log('\n── Matchup Summary ──');
	for (const [label, s] of Object.entries(summaries)) {
		const reasons = Object.entries(s.winReasonCounts || {}).map(([r, c]) => `${r}×${c}`).join(', ');
		console.log(`  ${label}: ${s.wins}W/${s.losses}L | avg ${s.avgTurns} turns | ${reasons}`);
	}

	// List cards always played (appear in 100% of games for that matchup)
	console.log('\n── Cards always played (100% of games) ──');
	for (const [label, s] of Object.entries(summaries)) {
		if (s.alwaysPlayed?.length) {
			console.log(`  ${label}: ${s.alwaysPlayed.join(', ')}`);
		}
	}
});
