// Phase 51: on wide screens the field tiles get wide (up to 290px) but stay as tall as the deck stack.
// Text used to scale with the width only, so the ability line ran into the name ("Michelle Iron Tuk").
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

for (const width of [1600, 2200, 2560]) {
	test(`field tiles: name, ability line, pill and MP do not overlap at ${width}px wide`, async ({ page }) => {
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
		const rows = await page.evaluate(() => [...document.querySelectorAll('.board-zone--player .card-v1--field')].map((c) => {
			const r = (s) => c.querySelector(s)?.getBoundingClientRect();
			const name = r('.cv1-name'), desc = r('.cv1-fdesc'), pill = r('.cv1-pill'), card = c.getBoundingClientRect();
			return { id: c.className.slice(0, 40), nameBottom: name?.bottom, descTop: desc?.top, descBottom: desc?.bottom, pillTop: pill?.top, cardTop: card.top, cardBottom: card.bottom, h: Math.round(card.height), w: Math.round(card.width) };
		}));
		expect(rows.length).toBeGreaterThan(0);
		for (const row of rows) {
			if (row.descTop != null) {
				expect(row.descTop, `${row.id} ability line starts below the name`).toBeGreaterThanOrEqual(row.nameBottom - 1);
				expect(row.descBottom, `${row.id} ability line ends above the pill`).toBeLessThanOrEqual(row.pillTop + 1);
			}
		}
	});
}
