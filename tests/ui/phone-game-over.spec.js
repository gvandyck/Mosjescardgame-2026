/**
 * phone-game-over.spec.js - Phase 65-10 game-over half of the old phone-screens.spec.js, moved here unchanged by 72.1-03 so the lobby half
 * could load. It is RED at import (forceHumanHeldLevel3Win.js is gone: hold-Level-3 no longer exists in 2.1) and is owned by plan 72.1-08,
 * which rewrites it for the Personal Quest win.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { forceHumanHeldLevel3Win } from '../helpers/forceHumanHeldLevel3Win.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { rectOf, undersized, pageOverflow } from '../helpers/phoneGeometry.js';
import { GAME_URL_TEST, waitForBoard } from './helpers.js';

const VIEWPORTS = [...PHONE_VIEWPORTS, PIXEL_VIEWPORT];
const SHOT_DIR = 'C:/tmp';

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
	return problems;
}

// Seeds a Play vs Bot session and a replay record, each only ONCE per tab (so Play again's new values are not overwritten).
async function seedVsBotSession(page) {
	await page.addInitScript(() => {
		if (sessionStorage.getItem('test:seeded')) return;
		sessionStorage.setItem('test:seeded', '1');
		sessionStorage.setItem('mosjes:offline', JSON.stringify({ name: 'TestPlayer', deckId: 'EXAMPLE_TAKSEN', botDeckId: 'EXAMPLE_REGELAARS', playerId: 'player_1' }));
		sessionStorage.setItem('obby2:replay', JSON.stringify({ mode: 'vsBot', name: 'TestPlayer', deckChoice: 'EXAMPLE_TAKSEN', botChoice: 'RANDOM' }));
	});
}

/** The game-over card against the window, and what its content does when taller than the card. */
const cardFit = (page) => page.evaluate(() => {
	const card = document.querySelector('.reward-card');
	const r = card.getBoundingClientRect();
	const style = getComputedStyle(card);
	return {
		left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom),
		w: window.innerWidth, h: window.innerHeight,
		taller: card.scrollHeight > card.clientHeight + 1, overflowY: style.overflowY,
	};
});

for (const vp of VIEWPORTS) {
	test.describe(`phone game-over at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = watchProblems(page);
			await seedVsBotSession(page);
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('(f)(g)(h) the card fits, every button is 44x44, Play again starts a new game by touch', async ({ page }) => {
			test.setTimeout(150000);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			await forceHumanHeldLevel3Win(page);
			await expect(page.locator('#reward-overlay')).toBeVisible();
			await page.waitForTimeout(600); // the fade-in finishes

			const fit = await cardFit(page);
			console.log(`[65-10] ${vp.name}: game-over card ${JSON.stringify(fit)}`);
			expect(fit.left, 'card left edge on screen').toBeGreaterThanOrEqual(0);
			expect(fit.right, `card right edge on screen ${JSON.stringify(fit)}`).toBeLessThanOrEqual(fit.w);
			expect(fit.top, 'card top on screen').toBeGreaterThanOrEqual(0);
			expect(fit.bottom, `card bottom on screen ${JSON.stringify(fit)}`).toBeLessThanOrEqual(fit.h);
			if (fit.taller) {
				expect(['auto', 'scroll'], 'a card taller than itself scrolls inside itself').toContain(fit.overflowY);
				await page.locator('.reward-actions').scrollIntoViewIfNeeded();
			}
			const actions = await rectOf(page, '.reward-actions');
			expect(actions.y, 'the buttons are reachable: top on screen').toBeGreaterThanOrEqual(0);
			expect(actions.bottom, `the buttons are reachable: bottom on screen ${JSON.stringify(actions)}`).toBeLessThanOrEqual(fit.h);
			expect((await pageOverflow(page)).x, 'no sideways overflow').toBeLessThanOrEqual(0);
			if (vp.name === '390x844') {
				mkdirSync(SHOT_DIR, { recursive: true });
				await page.evaluate(() => { document.querySelector('.reward-card').scrollTop = 0; });
				await page.screenshot({ path: `${SHOT_DIR}/65-10-phone-game-over-390x844.png` });
			}

			expect(await undersized(page, '.reward-btn', 44), 'every game-over button is at least 44x44').toEqual([]);
			for (const id of ['reward-again-btn', 'reward-back-btn', 'reward-copy-btn']) {
				await expect(page.locator(`#${id}`), `${id} exists`).toHaveCount(1);
			}

			await page.locator('#reward-again-btn').tap();
			await page.waitForURL('**/game.html?offline=true&player=player_1');
			await waitForBoard(page);
			await expect(page.locator('#reward-overlay')).toHaveCount(0);
		});

		test('(i) Back to Lobby by touch shows the lobby', async ({ page }) => {
			test.setTimeout(150000);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			await forceHumanHeldLevel3Win(page);
			await page.waitForTimeout(600);
			await page.locator('.reward-actions').scrollIntoViewIfNeeded();
			await page.locator('#reward-back-btn').tap();
			await page.waitForURL('**/index.html');
			await expect(page.locator('#lobby2')).toBeVisible();
			await expect(page.locator('[data-picker="mode"]')).toBeVisible();
		});
	});
}
