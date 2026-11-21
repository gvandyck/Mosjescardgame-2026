/**
 * phone-lobby-start.spec.js - Phase 72.1-03 (D-07, D-13, MOB-06, MOB-04): the lobby and the starting-Mosje pick on a phone, by touch,
 * at 395x731 (Pixel 8 Pro visible area), 390x844 and 360x740. Lobby: one column of deck tiles, the Mosje and Personal Quest lists
 * collapsed behind ONE Show cards button, Start always on screen, every control 44 px. Pick: a horizontal snap-scroll row of the five
 * faces; a swipe never picks, a tap picks. A desktop guard (1920x1080, mouse) shows the lists open and no toggle.
 */
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../../helpers/servePlaceholderFirebase.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { expectPhoneScreenSound } from '../../helpers/phoneGate.js';
import { expectBottomSheet } from '../../helpers/expectBottomSheet.js';
import { readSnapRow } from '../../helpers/readSnapRow.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { swipe } from '../../helpers/phoneSwipe.js';
import { rectOf, pageOverflow } from '../../helpers/phoneGeometry.js';
import { STARTER_DECKS_21 } from '../../../src/data/starterDecks21.js';

const TILES = '[data-picker="player-deck"] .deck-tile';
const TOGGLE = '[data-picker="player-deck"] ~ .deck-tiles__toggle';
const LISTS = '[data-picker="player-deck"] .deck-tile__mosjes, [data-picker="player-deck"] .deck-tile__quests';

/** How many of the matches of `selector` are drawn (box with an area). */
const shownCount = (page, selector) => page.evaluate((sel) => [...document.querySelectorAll(sel)].filter((el) => {
	const r = el.getBoundingClientRect();
	return r.width > 0 && r.height > 0;
}).length, selector);

/** Start against the window now: { top, bottom, inner }. */
const startBox = (page) => page.evaluate(() => {
	const r = document.getElementById('lobby2-start').getBoundingClientRect();
	return { top: Math.round(r.top), bottom: Math.round(r.bottom), inner: window.innerHeight };
});

const scrollToEnd = () => { window.scrollTo(0, document.documentElement.scrollHeight); document.body.scrollTop = document.body.scrollHeight; };

async function openLobby(page) {
	await page.goto('/');
	await expect(page.locator(TILES)).toHaveCount(3, { timeout: 15000 });
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone lobby start at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = [];
			page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
			page.on('console', msg => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('(a) one column of deck tiles, lists collapsed, a short lobby, no sideways scroll', async ({ page }) => {
			await openLobby(page);
			const lefts = await page.locator(TILES).evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().left)));
			const widths = await page.locator(TILES).evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().width)));
			expect(new Set(lefts).size, `one column: every tile has the same left ${lefts}`).toBe(1);
			expect(Math.min(...widths), `tile width ${widths}`).toBeGreaterThanOrEqual(300);
			expect(await shownCount(page, LISTS), 'closed: no Mosje or Personal Quest list is drawn').toBe(0);
			const height = await page.evaluate(() => document.documentElement.scrollHeight);
			expect(height, `closed lobby is at most 2.2 screens tall (${height} of ${vp.height})`).toBeLessThanOrEqual(vp.height * 2.2);
			expect((await pageOverflow(page)).x).toBeLessThanOrEqual(0);
		});

		test('(b) one Show cards button opens and closes the lists of all three tiles', async ({ page }) => {
			await openLobby(page);
			const toggle = page.locator(TOGGLE);
			await expect(toggle).toHaveCount(1);
			await expect(toggle).toHaveText('Show cards');
			await expect(toggle).toHaveAttribute('aria-expanded', 'false');
			const box = await rectOf(page, TOGGLE);
			expect(Math.min(box.w, box.h), 'toggle is at least 44 px').toBeGreaterThanOrEqual(44);
			await toggle.scrollIntoViewIfNeeded();
			await toggle.tap();
			await expect(toggle).toHaveText('Hide cards');
			await expect(toggle).toHaveAttribute('aria-expanded', 'true');
			for (const [i, deck] of STARTER_DECKS_21.entries()) {
				const tile = page.locator(TILES).nth(i);
				await expect(tile.locator('.deck-tile__mosjes .deck-tile__item'), `${deck.id}: five Mosje names`).toHaveCount(5);
				await expect(tile.locator('.deck-tile__quests .deck-tile__item'), `${deck.id}: four Personal Quest names`).toHaveCount(4);
				await expect(tile.locator('.deck-tile__mosjes')).toBeVisible();
				await expect(tile.locator('.deck-tile__quests')).toBeVisible();
			}
			expect((await pageOverflow(page)).x, 'open: no sideways scroll').toBeLessThanOrEqual(0);
			await toggle.tap();
			await expect(toggle).toHaveText('Show cards');
			expect(await shownCount(page, LISTS), 'closed again: lists hidden').toBe(0);
		});

		test('(c) Start stays on screen at scroll 0 and at the end, lists open or closed', async ({ page }) => {
			await openLobby(page);
			for (const open of [false, true]) {
				if (open) { await page.locator(TOGGLE).scrollIntoViewIfNeeded(); await page.locator(TOGGLE).tap(); }
				await page.evaluate(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; });
				const top = await startBox(page);
				expect(top.top, `open=${open} at scroll 0: Start top on screen`).toBeGreaterThanOrEqual(0);
				expect(top.bottom, `open=${open} at scroll 0: Start bottom on screen ${JSON.stringify(top)}`).toBeLessThanOrEqual(top.inner);
				await page.evaluate(scrollToEnd);
				const end = await startBox(page);
				expect(end.top, `open=${open} at the end: Start top on screen`).toBeGreaterThanOrEqual(0);
				expect(end.bottom, `open=${open} at the end: Start bottom on screen ${JSON.stringify(end)}`).toBeLessThanOrEqual(end.inner);
			}
		});

		test('(d) every control is 44 px and the Version badge covers no control, closed and open', async ({ page }) => {
			await openLobby(page);
			for (const open of [false, true]) {
				if (open) { await page.locator(TOGGLE).scrollIntoViewIfNeeded(); await page.locator(TOGGLE).tap(); }
				await expectPhoneScreenSound(page, { name: `lobby open=${open}`, scrollsVertically: true });
				await page.evaluate(scrollToEnd);
				const hits = await page.evaluate(() => {
					const b = document.getElementById('app-version').getBoundingClientRect();
					return [...document.querySelectorAll('#lobby2 button, #lobby2 input')].filter((el) => {
						const r = el.getBoundingClientRect();
						return r.width > 0 && r.height > 0 && r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top;
					}).map((el) => el.id || el.dataset.choiceId || el.className);
				});
				expect(hits, `open=${open}: the Version badge covers nothing`).toEqual([]);
				await page.evaluate(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; });
			}
		});

		test('(e) the starting pick is a snap-scroll row of five faces: a swipe never picks, a tap does', async ({ page }) => {
			test.setTimeout(120000);
			await openLobby(page);
			await page.locator(TILES).nth(1).tap();
			await page.locator('#lobby2-start').tap({ timeout: 8000 });
			await page.waitForURL(/game\.html/, { timeout: 15000 });
			const modal = page.locator('.modal-card--cards');
			await expect(modal).toBeVisible({ timeout: 20000 });
			await expect(modal.locator('h3')).toHaveText('Choose your starting Mosje');
			await expectBottomSheet(page, 'starting pick');

			const ROW = '.modal-card--cards .modal-mosje-select-list';
			const row = await readSnapRow(page, ROW);
			const faceW = Math.min(0.64 * vp.width, 240);
			expect(row.itemLefts.length, 'five faces').toBe(5);
			expect(row.scrollWidth, `row scrolls sideways (${row.scrollWidth} vs ${row.clientWidth})`).toBeGreaterThan(row.clientWidth);
			expect(row.snapType, 'snaps on x').toMatch(/^x mandatory/);
			expect(row.snapStop, 'one hard swipe never skips two faces').toBe('always');
			expect(row.flexWrap).toBe('nowrap');
			expect(row.overflowX).toBe('auto');
			expect(row.overflowY).toBe('hidden');
			for (const w of row.itemWidths) expect(Math.abs(w - faceW), `face width ${w} vs ${faceW}`).toBeLessThanOrEqual(1);
			expect(row.itemLefts[1], 'the second face peeks in from the right').toBeLessThan(row.rowRight);
			expect(row.itemLefts[0] + row.itemWidths[0], 'the first face ends inside the row').toBeLessThan(row.rowRight);

			// The text rule at the rendered width: nothing leaves its text box.
			const bad = await modal.evaluate((m) => [...m.querySelectorAll('.card-v1')].flatMap((card, i) => {
				const text = card.querySelector('.cv2-text');
				const box = card.querySelector('.cv2-textbox');
				if (!text || !box) return [];
				const out = text.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom;
				return out > 1 ? [`face ${i} text leaves its box by ${Math.round(out)}px`] : [];
			}));
			expect(bad, 'face text stays inside its box').toEqual([]);

			// Cancel and leave do not exist: a pick cannot be skipped.
			await expect(modal.locator('.modal-option-leave')).toHaveCount(0);
			await expect(modal.getByRole('button', { name: /cancel|leave|close/i })).toHaveCount(0);

			// A hover must not move a face on touch.
			const first = modal.locator('.modal-option--card').first();
			await first.hover();
			expect(await first.evaluate(el => getComputedStyle(el).transform), 'no hover lift on touch').toBe('none');

			await savePhoneShot(page, vp.name === PIXEL_VIEWPORT.name ? '72.1-03-starting-pick' : `72.1-03-starting-pick-${vp.name}`);

			// A swipe moves the row and picks nothing.
			const before = row.scrollLeft;
			const r = await rectOf(page, ROW);
			const y = r.y + r.h / 2;
			await swipe(page, { from: { x: vp.width - 40, y }, to: { x: vp.width - 190, y } });
			await page.waitForTimeout(600);
			const after = await readSnapRow(page, ROW);
			expect(after.scrollLeft, `the swipe moved the row (${before} -> ${after.scrollLeft})`).toBeGreaterThan(before);
			await expect(modal, 'the swipe did not close the modal').toBeVisible();
			await expect(modal.locator('.modal-option--card')).toHaveCount(5);

			// Bring the third face to the middle (a finger can only tap what is on screen; the snap row settles on it), then a tap picks it.
			const third = modal.locator('.modal-option--card').nth(2);
			const name = (await third.locator('.mosje-select-name').textContent()).trim();
			// Wait until the fling and the snap are over (a touch on a moving row only stops it, it is not a tap).
			await third.evaluate(el => el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'instant' }));
			let still = 0;
			let last = -1;
			await expect.poll(async () => {
				const now = (await readSnapRow(page, ROW)).scrollLeft;
				still = now === last ? still + 1 : 0;
				last = now;
				return still >= 3;
			}, { message: 'the row has stopped scrolling', intervals: [150], timeout: 10000 }).toBe(true);
			const mid = await rectOf(page, '.modal-card--cards .modal-option--card:nth-child(3)');
			expect(mid.x, 'the third face is fully on screen (left)').toBeGreaterThanOrEqual(0);
			expect(mid.right, 'the third face is fully on screen (right)').toBeLessThanOrEqual(vp.width);
			// Headless Chromium sometimes drops the click of the FIRST synthetic tap after the CDP swipe (pointerdown/up arrive, the node is
			// unchanged, no click); a second tap picks. So: tap until the modal is gone, at most three taps; the pick itself is asserted below.
			for (let attempt = 0; attempt < 3 && await modal.count(); attempt++) {
				await third.tap();
				await modal.waitFor({ state: 'detached', timeout: 1500 }).catch(() => {});
			}
			await page.locator('.mosje-card--owned').first().waitFor({ state: 'attached', timeout: 20000 });
			await expect(modal).toHaveCount(0);
			const field = (await page.locator('.mosje-card--owned').first().textContent()) ?? '';
			const squash = (t) => t.toLowerCase().replace(/[^a-z0-9]/g, '');
			expect(squash(field), `the field Mosje is ${name}`).toContain(squash(name));
		});
	});
}

test.describe('lobby on a desktop (guard)', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
	test('the lists are visible and no Show cards button is displayed', async ({ page }) => {
		await servePlaceholderFirebase(page);
		await openLobby(page);
		expect(await shownCount(page, LISTS), 'six lists drawn (three tiles x two)').toBe(6);
		const display = await page.locator(TOGGLE).evaluate(el => getComputedStyle(el).display).catch(() => 'missing');
		expect(display).toBe('none');
	});
});
