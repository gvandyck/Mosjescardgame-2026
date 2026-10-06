// Phase 51: face-down Piecies on the field (the opponent's played cards) must be the same size as
// the face-up field tiles; they used to keep the old tall card size.
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

test('face-down piecie slots are as big as the field tiles', async ({ page }) => {
	await page.setViewportSize({ width: 1800, height: 1000 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.setMosjeOnField('player_2', 0, 'mosje_azn_cless', { mp: 20 });
		h.setPiecieOnField('player_2', 0, 'piecie_leipe_swap', { faceDown: true });
		h.setPiecieOnField('player_2', 1, 'piecie_warm_kannetje_melk', { faceDown: true });
	});
	await page.waitForTimeout(900);
	const sizes = await page.evaluate(() => {
		const r = (el) => { const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; };
		return { tile: r(document.querySelector('.board-zone--opponent .card-v1--field')), down: [...document.querySelectorAll('.board-zone--opponent .face-down-piecie')].map(r) };
	});
	expect(sizes.down.length).toBe(2);
	for (const d of sizes.down) {
		expect(Math.abs(d.w - sizes.tile.w), 'width matches a face-up tile').toBeLessThanOrEqual(4);
		expect(Math.abs(d.h - sizes.tile.h), 'height matches a face-up tile').toBeLessThanOrEqual(4);
	}
});
