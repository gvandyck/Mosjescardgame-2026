/**
 * mobile-canary.spec.js - Phase 64-07 (D-30): REPORT-ONLY phone canary, own Playwright project "mobile-canary"
 * (chromium, isMobile + hasTouch, 390x844, headless; `npm run test:mobile-canary`). It is not part of the gate:
 * a red here is written to the report and handed to Phase 65, never fixed or enforced in Phase 64.
 *
 * Flow: lobby -> tap the Regelaars tile -> tap Start -> the board loads. It checks that neither page scrolls sideways
 * and that no console / page error fired, and it saves the lobby and board screenshots + report.json to
 * tests/ui/screenshots/mobile-canary/ (git-ignored) so Phase 65 starts from real phone pictures (board.png is the Draw step prompt
 * over the board; board-after-draw.png is the board once that prompt is answered by tap).
 * Every check is expect.soft and the screenshots are taken before any assertion, so a failing board never hides a number.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';

const OUT = 'tests/ui/screenshots/mobile-canary';
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test('mobile canary (report only, D-30): lobby -> deck -> Start -> board at 390x844 touch', async ({ page }) => {
	mkdirSync(OUT, { recursive: true });
	await servePlaceholderFirebase(page);
	const pageErrors = [];
	const consoleErrors = [];
	page.on('pageerror', err => pageErrors.push(err.message));
	page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

	const report = { viewport: page.viewportSize(), lobbyOverflowX: null, boardOverflowX: null, consoleErrors, pageErrors, gameStarted: false, stepError: null };
	try {
		await page.goto('/');
		await expect(page.locator('[data-picker="player-deck"] .deck-tile')).toHaveCount(3, { timeout: 15000 });
		await page.screenshot({ path: `${OUT}/lobby.png`, fullPage: true });
		report.lobbyOverflowX = await overflowX(page);

		await page.locator('[data-picker="player-deck"] [data-choice-id="EXAMPLE_REGELAARS"]').tap();
		await page.locator('#lobby2-start').tap();
		await page.waitForURL(/game\.html/, { timeout: 15000 });
		await page.locator('.mosje-card--owned').first().waitFor({ state: 'attached', timeout: 20000 });
		report.gameStarted = true;
		await page.waitForTimeout(1500);
		await page.screenshot({ path: `${OUT}/board.png` });
		await page.screenshot({ path: `${OUT}/board-full.png`, fullPage: true });
		report.boardOverflowX = await overflowX(page);

		// The Draw step prompt covers the board at the start of every human turn: answer it by tap and keep one clear board picture.
		await page.locator('.modal-mosje-select-btn[data-id="draw"]').first().tap({ timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(1200);
		await page.screenshot({ path: `${OUT}/board-after-draw.png` });
	} catch (err) {
		report.stepError = String(err.message).split('\n')[0];
	}
	writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));

	expect.soft(report.stepError, 'lobby -> board flow completed').toBeNull();
	expect.soft(report.lobbyOverflowX, 'lobby: no page-level horizontal scroll').toBeLessThanOrEqual(0);
	expect.soft(report.boardOverflowX, 'board: no page-level horizontal scroll').toBeLessThanOrEqual(0);
	expect.soft([...consoleErrors, ...pageErrors], 'no console / page errors').toEqual([]);
});
