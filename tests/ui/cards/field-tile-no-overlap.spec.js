// Phase 51: on wide screens the field tiles get wide (up to 290px) but stay as tall as the deck stack.
// Text used to scale with the width only, so the ability line ran into the name ("Michelle Iron Tuk").
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';
import { collectFaceZones, findFaceCollisions } from '../../helpers/faceZones.js';

// Phase 62-05: the same guard on the 2.0 tile: name, L chip, Power, MP, pill and the Activate / ability button never overlap.
for (const width of [1600, 2200, 2560]) {
	test(`field tiles: name, L chip, Power, MP, pill and buttons do not overlap at ${width}px wide`, async ({ page }) => {
		await page.setViewportSize({ width, height: 1200 });
		await seedOfflineSession(page);
		await page.goto(GAME_URL_TEST);
		await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
		await page.evaluate(() => {
			const h = window.__testHooks;
			h.setMosjeOnField('player_1', 0, 'mosje_michelle', { mp: 10 });
			h.setMosjeOnField('player_1', 1, 'mosje_chris_ddr', { mp: 15 });
			['piecie_call_of_welloes', 'piecie_warm_kannetje_melk'].forEach((id, i) => h.setPiecieOnField('player_1', i, id));
		});
		await page.waitForTimeout(900);
		const rows = await page.evaluate(collectFaceZones, '.board-zone--player .card-v1--field');
		expect(rows.length).toBeGreaterThan(0);
		for (const row of rows) {
			expect(row.tile, `${row.id} is a 2.0 field tile`).toBe(true);
			expect(row.zones.name, `${row.id} has a name`).not.toBeNull();
		}
		expect(findFaceCollisions(rows), `tile zones that collide or leave the tile at ${width}px wide`).toEqual([]);
	});
}
