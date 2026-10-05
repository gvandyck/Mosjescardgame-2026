// Phase 51: hovering the hand must not shove the other cards around. A margin rule used to spread
// every card (about 20px each) the moment the pointer entered the hand and snap them back on leave,
// with no transition: the "stiff / jittery" hand.
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

test('hand: entering the hand does not move the other cards', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => window.__testHooks.setHand('player_1', ['mosje_hacker', 'piecie_call_of_welloes', 'snelle_lucky_coin', 'place_the_gym', 'piecie_warm_kannetje_melk', 'mosje_chris_ddr', 'piecie_leipe_swap']));
	await page.waitForTimeout(1200);
	const lefts = () => page.evaluate(() => [...document.querySelectorAll('.hand-card-wrap')].map((w) => w.getBoundingClientRect().left));
	await page.mouse.move(800, 300);
	await page.waitForTimeout(700);
	const before = await lefts();
	await page.mouse.move(790, 860); // over one card
	await page.waitForTimeout(900);
	const after = await lefts();
	const hovered = await page.evaluate(() => [...document.querySelectorAll('.hand-card-wrap')].findIndex((w) => w.matches(':hover')));
	before.forEach((x, i) => {
		if (i === hovered) return;
		expect(Math.abs(after[i] - x), `card ${i} moved ${Math.round(after[i] - x)}px when the pointer entered the hand`).toBeLessThanOrEqual(8);
	});
});
