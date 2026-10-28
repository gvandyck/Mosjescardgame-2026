/**
 * phone-screens.spec.js - Phase 65-10 (MOB-06 second half, D-16, D-07, D-15, D-19 d): the lobby and the game-over card on a phone, by touch,
 * at 390x844, 360x740 and Gandalf's Pixel 8 Pro (395x731). Lobby: Start is fully on screen at load (no scrolling), the Version badge
 * overlaps no control, every control is at least 44x44, the page never scrolls sideways, and Play vs Bot / Watch Bots both start a game
 * by tap. Game-over: the card fits (inside the window, or scrolling inside itself with its buttons reachable), every button is at least
 * 44x44, "Play again" starts a new game and "Back to Lobby" returns to the lobby, both by tap. Emulation proves layout and taps; only
 * the real phone proves Chrome's address bar and navigation bar next to the sticky Start button.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { forceHumanHeldLevel3Win } from '../helpers/forceHumanHeldLevel3Win.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { rectOf, undersized, pageOverflow } from '../helpers/phoneGeometry.js';
import { GAME_URL_TEST, waitForBoard } from './helpers.js';

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
			await page.locator(pick('player-deck', 'EXAMPLE_REGELAARS')).tap();
			await expect(page.locator(pick('player-deck', 'EXAMPLE_REGELAARS'))).toHaveAttribute('aria-checked', 'true');
			await page.locator('#lobby2-start').tap({ timeout: 8000 });
			await page.waitForURL(/game\.html/, { timeout: 15000 });
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
