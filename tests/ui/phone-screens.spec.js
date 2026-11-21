/**
 * phone-screens.spec.js - Phase 65-10, repaired for 2.1 in 72.1-03 (MOB-06, D-07): the lobby on a phone, by touch, at 390x844, 360x740
 * and Gandalf's Pixel 8 Pro (395x731). Start is fully on screen at load (no scrolling), the Version badge overlaps no control, every
 * control is at least 44x44, the page never scrolls sideways, and Play vs Bot (starter deck, starting pick tapped) / Watch Bots both start
 * a game by tap. The game-over half moved to phone-game-over.spec.js (plan 72.1-08). Emulation proves layout and taps; only the real
 * phone proves Chrome's address bar and navigation bar next to the sticky Start button.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { undersized, pageOverflow } from '../helpers/phoneGeometry.js';

const VIEWPORTS = [...PHONE_VIEWPORTS, PIXEL_VIEWPORT];
const pick = (picker, id) => `[data-picker="${picker}"] [role="radio"][data-choice-id="${id}"]`;
const CONTROLS = '#lobby2 button, #lobby2 input';
const SHOT_DIR = 'C:/tmp';

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
	return problems;
}

async function openLobby(page) {
	await page.goto('/');
	await expect(page.locator('[data-picker="mode"]')).toBeVisible();
	await expect(page.locator('#app-version')).toHaveText(/^Version \S+/);
}

/** Start's box at scroll 0 against the window: { scrollY, top, bottom, inner }. */
const startAtLoad = (page) => page.evaluate(() => {
	const r = document.getElementById('lobby2-start').getBoundingClientRect();
	return { scrollY: window.scrollY + document.body.scrollTop, top: Math.round(r.top), bottom: Math.round(r.bottom), inner: window.innerHeight };
});

/** The lobby page scrolls inside the body (main.css: html and body are 100% tall, overflow hidden / auto), so both scrollers move together. */
const scrollToEnd = () => { window.scrollTo(0, document.documentElement.scrollHeight); document.body.scrollTop = document.body.scrollHeight; };
const scrollToStart = () => { window.scrollTo(0, 0); document.body.scrollTop = 0; };

/** The lobby controls the Version badge overlaps right now (ids / choice ids), and the badge box. */
const badgeOverlaps = (page) => page.evaluate((selector) => {
	const b = document.getElementById('app-version').getBoundingClientRect();
	const hits = [...document.querySelectorAll(selector)].filter((el) => {
		const r = el.getBoundingClientRect();
		return r.width > 0 && r.height > 0 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
	}).map((el) => el.id || el.dataset.choiceId || el.className);
	return { hits, badge: { x: Math.round(b.left), y: Math.round(b.top), right: Math.round(b.right), bottom: Math.round(b.bottom) } };
}, CONTROLS);

for (const vp of VIEWPORTS) {
	test.describe(`phone lobby at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = watchProblems(page);
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('(a) Start is fully on screen at load without scrolling, in both modes', async ({ page }) => {
			await openLobby(page);
			for (const mode of ['vsBot', 'watchBots']) {
				if (mode === 'watchBots') await page.locator(pick('mode', 'watchBots')).tap();
				await expect(page.locator(pick('mode', mode))).toHaveAttribute('aria-checked', 'true');
				const start = await startAtLoad(page);
				console.log(`[65-10] ${vp.name} ${mode}: Start ${JSON.stringify(start)}`);
				expect(start.scrollY, `${mode}: at the top of the page`).toBe(0);
				expect(start.top, `${mode}: Start top on screen`).toBeGreaterThanOrEqual(0);
				expect(start.bottom, `${mode}: Start bottom on screen ${JSON.stringify(start)}`).toBeLessThanOrEqual(start.inner);
			}
		});

		test('(b) the Version badge overlaps no button or input and stays reachable', async ({ page }) => {
			await openLobby(page);
			for (const mode of ['vsBot', 'watchBots']) {
				if (mode === 'watchBots') await page.locator(pick('mode', 'watchBots')).tap();
				const top = await badgeOverlaps(page);
				expect(top.hits, `${mode} at load: the badge ${JSON.stringify(top.badge)} covers nothing`).toEqual([]);
				await page.evaluate(scrollToEnd);
				const end = await badgeOverlaps(page);
				expect(end.hits, `${mode} at the end of the page: the badge ${JSON.stringify(end.badge)} covers nothing`).toEqual([]);
				const inside = await page.evaluate(() => {
					const r = document.getElementById('app-version').getBoundingClientRect();
					return r.left >= 0 && r.right <= window.innerWidth && r.top >= 0 && r.bottom <= window.innerHeight + 0.5;
				});
				expect(inside, `${mode}: at the end of the page the badge is fully readable on screen`).toBe(true);
				await page.evaluate(scrollToStart);
			}
		});

		test('(c) every control is at least 44x44 and the page never scrolls sideways', async ({ page }) => {
			await openLobby(page);
			for (const mode of ['vsBot', 'watchBots']) {
				if (mode === 'watchBots') await page.locator(pick('mode', 'watchBots')).tap();
				expect(await undersized(page, CONTROLS, 44), `${mode}: controls under 44x44`).toEqual([]);
				const over = await pageOverflow(page);
				expect(over.x, `${mode}: sideways overflow ${over.x}`).toBeLessThanOrEqual(0);
			}
		});

		test('(d) Play vs Bot by touch: pick a deck, tap Start, the board appears', async ({ page }) => {
			await openLobby(page);
			await page.locator(pick('player-deck', 'STARTER_PHYSICAL')).tap();
			await expect(page.locator(pick('player-deck', 'STARTER_PHYSICAL'))).toHaveAttribute('aria-checked', 'true');
			await page.locator('#lobby2-start').tap({ timeout: 8000 });
			await page.waitForURL(/game\.html/, { timeout: 15000 });
			// 2.1: a lobby game asks for the starting Mosje first (72-13); tap the first face.
			const startPick = page.locator('.modal-card--cards .modal-option--card').first();
			await expect(startPick).toBeVisible({ timeout: 20000 });
			await startPick.tap();
			await page.locator('.mosje-card--owned').first().waitFor({ state: 'attached', timeout: 20000 });
			expect((await pageOverflow(page)).x, 'the board does not scroll sideways').toBeLessThanOrEqual(0);
		});

		test('(e) Watch Bots by touch: tap the mode, tap Start, a bot game opens and leaves Loading', async ({ page }) => {
			await openLobby(page);
			await page.locator(pick('mode', 'watchBots')).tap();
			await page.locator('#lobby2-start').tap({ timeout: 8000 });
			await page.waitForURL(/game\.html\?.*botvsbot=true/, { timeout: 15000 });
			await page.waitForFunction(() => {
				const label = document.getElementById('turn-label');
				return label && !label.textContent.includes('Loading') && !label.textContent.includes('Connecting');
			}, { timeout: 20000 });
		});
	});
}

test.describe('lobby screenshots', () => {
	test.describe('phone 390x844', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('saves the phone lobby at load', async ({ page }) => {
			await servePlaceholderFirebase(page);
			await openLobby(page);
			mkdirSync(SHOT_DIR, { recursive: true });
			await page.screenshot({ path: `${SHOT_DIR}/65-10-phone-390x844.png` });
		});
	});
	test.describe('desktop 1920x1080', () => {
		test.use({ viewport: { width: 1920, height: 1080 } });
		test('saves the desktop lobby with the mouse', async ({ page }) => {
			await servePlaceholderFirebase(page);
			await openLobby(page);
			mkdirSync(SHOT_DIR, { recursive: true });
			await page.screenshot({ path: `${SHOT_DIR}/65-10-desktop-1920x1080.png` });
		});
	});
});
