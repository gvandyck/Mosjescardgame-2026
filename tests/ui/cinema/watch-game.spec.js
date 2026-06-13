/**
 * watch-game.spec.js — sit back and watch a full bot-vs-bot game play out SLOWLY
 * (1000ms per step) on the real UI. Not an assertion test; a viewer.
 *   npx playwright test --project=visual tests/ui/cinema/watch-game.spec.js --headed
 *
 * NOTE: long-running (a full game). Excluded from the quick `test:cinema` run via
 * its filename — only runs when invoked explicitly.
 */

import { test } from '@playwright/test';

test('🎬 Watch a full game — bot vs bot, slow', async ({ page }) => {
	test.setTimeout(600000); // up to 10 minutes

	// botvsbot + a long per-step delay → slow & watchable. Override with CINEMA=<ms>.
	const delay = Number(process.env.CINEMA) || 3000;
	await page.goto(`/game?botvsbot=true&delay=${delay}&deck1=PHYSICAL_FORCE&deck2=ARTISTIC_RHYTHM&testMode=true`);
	await page.waitForSelector('.mosje-card--owned, .mosje-card--opponent', { timeout: 20000 });
	console.log('🎬 Game started — both sides driven by the bot. Watch it play…');

	// Let it run until someone wins (reward overlay), then linger a moment.
	await page.waitForSelector('#reward-overlay', { timeout: 590000 });
	console.log('🎬 Game over — winner overlay shown.');
	await page.waitForTimeout(4000);
});
