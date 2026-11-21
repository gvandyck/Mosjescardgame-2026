/**
 * phone-canary.spec.js - Phase 72.1-02 (D-09, D-03): the asserting phone canary, replaces the report-only mobile-canary.
 * Lobby -> three starter deck tiles -> Start -> starting-Mosje pick (first face tapped) -> board, at 395x731 (Pixel 8 Pro visible
 * area), 390x844 and 360x740, touch, headless. Fails on sideways page scroll, a console or page error, a control under 44 px,
 * a clipped screen, Start below the fold, a header that is cut, an open drawer or a missing bottom bar.
 * Screenshots are taken before any assertion into tests/ui/screenshots/phone-canary/ (git-ignored), with a report.json.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { servePlaceholderFirebase } from '../../helpers/servePlaceholderFirebase.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { expectPhoneScreenSound } from '../../helpers/phoneGate.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { rectOf } from '../../helpers/phoneGeometry.js';
import { STARTER_DECKS_21 } from '../../../src/data/starterDecks21.js';

const OUT = 'tests/ui/screenshots/phone-canary';
const DECK_IDS = STARTER_DECKS_21.map(d => d.id);

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone canary at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('lobby, Start, starting pick and board are sound', async ({ page }) => {
			mkdirSync(OUT, { recursive: true });
			await servePlaceholderFirebase(page);
			const errors = [];
			page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
			page.on('console', msg => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
			const report = { viewport: vp.name, steps: [] };
			const shot = async (name) => { await page.screenshot({ path: `${OUT}/${vp.name}-${name}.png` }); report.steps.push(name); };
			try {
				// Lobby: the three starter tiles, Start reachable on screen.
				await page.goto('/');
				const tiles = page.locator('[data-picker="player-deck"] .deck-tile');
				await expect(tiles).toHaveCount(3, { timeout: 15000 });
				expect(await tiles.evaluateAll(els => els.map(e => e.dataset.deckId))).toEqual(DECK_IDS);
				await shot('lobby');
				await expectPhoneScreenSound(page, { name: 'lobby', scrollsVertically: true });
				const start = page.locator('#lobby2-start');
				await start.scrollIntoViewIfNeeded();
				const startBox = await rectOf(page, '#lobby2-start');
				expect(startBox.bottom, 'Start is on screen').toBeLessThanOrEqual(vp.height);
				expect(startBox.x, 'Start is inside the left edge').toBeGreaterThanOrEqual(0);
				expect(startBox.right, 'Start is inside the right edge').toBeLessThanOrEqual(vp.width);

				// Start opens the game: the starting-Mosje pick (the lobby always asks, 72-13).
				await start.tap();
				await page.waitForURL(/game\.html/, { timeout: 15000 });
				const pick = page.locator('.modal-card--cards');
				await expect(pick).toBeVisible({ timeout: 20000 });
				await expect(pick.locator('h3')).toHaveText('Choose your starting Mosje');
				await expect(pick.locator('.modal-mosje-select-btn').first()).toBeVisible();
				await shot('pick');
				await expectPhoneScreenSound(page, { name: 'starting pick' });
				await pick.locator('.modal-mosje-select-btn').first().tap();

				// Board: a Mosje of mine, bottom bar, closed drawer, readable header.
				await page.locator('.mosje-card--owned').first().waitFor({ state: 'attached', timeout: 20000 });
				const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]').first();
				if (await draw.waitFor({ state: 'visible', timeout: 2500 }).then(() => true, () => false)) await draw.tap();
				await page.waitForTimeout(1200);
				await shot('board');
				if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-02-canary-board');
				const board = await page.evaluate(() => {
					const label = document.getElementById('turn-label');
					return {
						cut: label.scrollWidth - label.clientWidth,
						expanded: document.getElementById('phone-hand-toggle')?.getAttribute('aria-expanded'),
					};
				});
				const bar = await rectOf(page, '#phone-bar');
				expect(bar, 'bottom bar exists').not.toBeNull();
				expect(bar.w, 'bottom bar has width').toBeGreaterThan(0);
				expect(bar.bottom, 'bottom bar is on screen').toBeLessThanOrEqual(vp.height + 1);
				expect(board.expanded, 'hand drawer is closed').toBe('false');
				expect(board.cut, 'turn label is not cut').toBeLessThanOrEqual(1);
				for (const sel of ['#btn-toggle-win', '#btn-toggle-log']) {
					const r = await rectOf(page, sel);
					expect(r, `${sel} exists`).not.toBeNull();
					expect(Math.min(r.w, r.h), `${sel} is at least 44 px`).toBeGreaterThanOrEqual(44);
					expect(r.right, `${sel} inside the screen`).toBeLessThanOrEqual(vp.width);
				}
				await expectPhoneScreenSound(page, { name: 'board' });
			} finally {
				report.errors = errors;
				writeFileSync(`${OUT}/${vp.name}-report.json`, JSON.stringify(report, null, 2));
			}
			expect(errors, 'no console or page error').toEqual([]);
		});
	});
}
