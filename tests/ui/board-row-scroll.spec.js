// Phase 51: each player's field is ONE horizontal row. When it is wider than the screen it must
// start at the left edge and still be draggable (left and right) so every card can be reached.
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from './helpers.js';

test('board row: wider than the screen starts at the left and drags both ways', async ({ page }) => {
	await page.setViewportSize({ width: 1000, height: 800 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.setMosjeOnField('player_1', 0, 'mosje_hacker', { mp: 15 });
		h.setMosjeOnField('player_1', 1, 'mosje_chris_ddr', { mp: 15 });
		['piecie_call_of_welloes', 'piecie_warm_kannetje_melk', 'piecie_stripje_bennies', 'piecie_leipe_swap'].forEach((id, i) => h.setPiecieOnField('player_1', i, id));
		h.setActivePlace('place_the_gym');
	});
	const row = page.locator('.board-zone--player .board-zone__row');
	const state = () => row.evaluate((r) => ({ sw: r.scrollWidth, cw: r.clientWidth, sl: Math.round(r.scrollLeft), firstLeft: r.querySelector('.card').getBoundingClientRect().left, rowLeft: r.getBoundingClientRect().left }));
	await expect.poll(async () => (await state()).sw).toBeGreaterThan((await state()).cw);
	const start = await state();
	expect(start.firstLeft).toBeGreaterThanOrEqual(start.rowLeft - 1); // first card is not clipped off the left
	const box = await row.boundingBox();
	const y = box.y + 60;
	await page.mouse.move(box.x + box.width / 2, y); await page.mouse.down();
	await page.mouse.move(box.x + box.width / 2 - 400, y, { steps: 12 }); await page.mouse.up();
	await expect.poll(async () => (await state()).sl).toBeGreaterThan(100);
	await page.mouse.move(box.x + 300, y); await page.mouse.down();
	await page.mouse.move(box.x + 900, y, { steps: 12 }); await page.mouse.up();
	await expect.poll(async () => (await state()).sl).toBe(0);
});
