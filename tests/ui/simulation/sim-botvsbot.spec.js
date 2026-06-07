/**
 * sim-botvsbot.spec.js — Bot vs Bot statistical simulation.
 *
 * Far simpler and more reliable than the auto-player approach: the game's own
 * smart bot (driveBotTurnSteps) drives BOTH sides in JS. No UI clicking, no
 * modal races. The test just navigates with ?botvsbot=true and waits for the
 * reward overlay, collecting console logs for analysis.
 *
 * URL params used:
 *   botvsbot=true   — both players driven by the smart bot
 *   fast=true       — collapse the 1000ms per-step animation delay to 30ms
 *   deck1, deck2    — control the matchup (else random)
 *   testMode=true   — expose __testHooks (not strictly needed here)
 *
 * 10 games × 3 deck matchups = 30 games. Writes sim-botvsbot-report.json.
 *
 * Run: npx playwright test --project=sim tests/ui/simulation/sim-botvsbot.spec.js
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ss } from '../helpers.js';
import { attachCollector, buildGameRecord, aggregateRecords } from './game-collector.js';

const MATCHUPS = [
	{ p1: 'PHYSICAL_FORCE',  p2: 'DIGITAL_CONTROL',  label: 'PF-vs-DC' },
	{ p1: 'DIGITAL_CONTROL', p2: 'ARTISTIC_RHYTHM',  label: 'DC-vs-AR' },
	{ p1: 'ARTISTIC_RHYTHM', p2: 'PHYSICAL_FORCE',   label: 'AR-vs-PF' },
];
const GAMES_PER_MATCHUP = 10;
const WIN_REASONS = new Set(['LEVEL_3', 'KNOCKOUT', 'QUEST_MASTER', 'MOMENTUM_DOMINATION']);

const allRecords = [];

/** Block Firebase so the game runs in LOCAL mode, then build the bot-vs-bot URL. */
async function gotoBotVsBot(page, deck1, deck2) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	const url = `/game?botvsbot=true&fast=true&deck1=${deck1}&deck2=${deck2}&testMode=true`;
	await page.goto(url);
	// Wait until the board has rendered (a Mosje card appears for at least one side)
	await page.waitForSelector('.mosje-card--owned, .mosje-card--opponent', { timeout: 20000 });
}

for (const matchup of MATCHUPS) {
	for (let gameIndex = 1; gameIndex <= GAMES_PER_MATCHUP; gameIndex++) {
		test(`botsim: ${matchup.label} game ${gameIndex}/${GAMES_PER_MATCHUP}`, async ({ page }) => {
			test.setTimeout(120000);

			const collector = attachCollector(page);
			await gotoBotVsBot(page, matchup.p1, matchup.p2);

			// The bot loop self-drives to completion — just wait for the reward overlay.
			await page.waitForSelector('#reward-overlay', { timeout: 90000 });
			await ss(page, `botsim-${matchup.label}-g${gameIndex}`);

			const record = await buildGameRecord(page, collector, {
				matchup: matchup.label,
				p1Deck: matchup.p1,
				p2Deck: matchup.p2,
				gameIndex,
			});
			allRecords.push(record);

			// ── Assertions ──
			expect(collector.getErrors(), 'No page errors').toHaveLength(0);
			expect(WIN_REASONS.has(record.winReason),
				`Win reason "${record.winReason}" must be valid`).toBe(true);

			console.log(
				`  ${matchup.label} G${gameIndex}: ${record.winner} won (${record.winReason}) ` +
				`~${record.turnCount} turns | ${record.questsAttempted} quests, ` +
				`${record.pieciesActivated} piecies, ${record.crashes} crashes`
			);
		});
	}
}

test.afterAll(() => {
	if (allRecords.length === 0) return;

	const byMatchup = {};
	for (const r of allRecords) {
		(byMatchup[r.matchup] ??= []).push(r);
	}
	const summaries = {};
	for (const [label, records] of Object.entries(byMatchup)) {
		summaries[label] = aggregateRecords(records);
	}

	const report = {
		generatedAt: new Date().toISOString(),
		mode: 'bot-vs-bot',
		totalGames: allRecords.length,
		gamesPerMatchup: GAMES_PER_MATCHUP,
		totalCrashes: allRecords.reduce((s, r) => s + r.crashes, 0),
		matchups: summaries,
		allGames: allRecords,
	};

	const outDir = join(process.cwd(), 'tests', 'ui', 'simulation');
	mkdirSync(outDir, { recursive: true });
	writeFileSync(join(outDir, 'sim-botvsbot-report.json'), JSON.stringify(report, null, 2));
	console.log(`\n📊 Bot-vs-bot report → tests/ui/simulation/sim-botvsbot-report.json`);

	console.log('\n── Matchup Summary (Bot A = player_1) ──');
	for (const [label, s] of Object.entries(summaries)) {
		const reasons = Object.entries(s.winReasonCounts || {}).map(([r, c]) => `${r}×${c}`).join(', ');
		console.log(`  ${label}: Bot A ${s.wins}W / Bot B ${s.losses}W | avg ${s.avgTurns} turns | ${reasons}`);
	}
	console.log('\n── Cards always activated (100% of games) ──');
	for (const [label, s] of Object.entries(summaries)) {
		if (s.alwaysPlayed?.length) console.log(`  ${label}: ${s.alwaysPlayed.join(', ')}`);
	}
});
