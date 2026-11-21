/**
 * phone-sheets.spec.js - Phase 65-08 (MOB-05; D-12, D-14, D-15, D-19 a/b): on a phone every prompt and picker that goes through
 * modalManager is a bottom sheet, and the card detail view is a big centred card sized to the phone. Run at 390x844, 360x740 and
 * Gandalf's Pixel 8 Pro (395x731), with the seeded board behind the modal:
 *  SHEETS (one test per builder): full width on the bottom edge, at most 78 % of the screen tall, bottom padding of at least 16 px
 *    (the safe-area floor), a light backdrop without blur (the board stays visible), every button at least 44x44, no sideways
 *    overflow, and long content scrolls INSIDE the sheet. The Draw step additionally leaves the opponent's row uncovered.
 *  DETAIL (Mosje, Piecie, Place, Quest): centred, inside the viewport with a margin, the face at least 60 % of the screen width,
 *    a Close button of at least 44x44 that is on screen at open (no scrolling) and a REAL touch tap on it closes the view.
 *  OTHER: the hover popup is hidden in a narrow mouse window, the action spotlight is small, centred, tap-through and clear of the
 *    bar, and the desktop at 1920x1080 keeps its dark centred card modals.
 * Emulation proves the geometry and the taps; only Gandalf's phone proves the slide-up feel, the Android keyboard over the text
 * input sheet and Chrome's navigation bar under a sheet.
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { openModalBuilder } from '../helpers/openModalBuilder.js';
import { readSheet } from '../helpers/readSheet.js';
import { rectOf, intersects, undersized, pageOverflow } from '../helpers/phoneGeometry.js';
import { SHEET_CASES, DETAIL_CASES } from '../helpers/phoneSheetCases.js';

const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const SETTLE = 500; // the slide-up (220 ms) and the old pop-in (300 ms) are over
const BUTTONS = '#modal-root .modal-card button, #modal-root .modal-card .modal-input';
const modalOpen = (page) => page.locator('#modal-root.modal-root--open');

/** The sheet checks (D-14, D-15). Soft, so one run lists every defect of a case. */
async function expectSheet(page, c) {
	const scrollInner = c.scrollIn && c.scrollIn !== 'card' ? c.scrollIn : '';
	const s = await readSheet(page, scrollInner);
	expect(s, 'a modal is open').not.toBeNull();
	expect.soft(Math.abs(s.left), `left edge ${s.left}`).toBeLessThanOrEqual(1);
	expect.soft(Math.abs(s.right - s.innerWidth), `right edge ${s.right} of ${s.innerWidth}`).toBeLessThanOrEqual(1);
	expect.soft(Math.abs(s.bottom - s.innerHeight), `bottom edge ${s.bottom} of ${s.innerHeight}`).toBeLessThanOrEqual(1);
	expect.soft(s.height, `height ${s.height} of ${s.innerHeight}`).toBeLessThanOrEqual(0.78 * s.innerHeight + 1);
	expect.soft(s.paddingBottom, 'padding-bottom (safe-area floor)').toBeGreaterThanOrEqual(16);
	expect.soft(s.backAlpha, 'backdrop alpha').toBeLessThanOrEqual(0.5);
	expect.soft(s.backFilter, 'backdrop blur').toBe('none');
	expect.soft(await undersized(page, BUTTONS), 'buttons under 44x44').toEqual([]);
	for (const sel of c.targets || []) expect.soft(await undersized(page, `#modal-root .modal-card ${sel}`), `${sel} under 44x44`).toEqual([]);
	expect.soft(s.scrollWidth, 'card scrollWidth').toBeLessThanOrEqual(s.clientWidth);
	expect.soft((await pageOverflow(page)).x, 'page overflow x').toBeLessThanOrEqual(0);
	for (const sel of c.reach || []) {
		const box = await rectOf(page, sel);
		expect.soft(box && box.y >= 0 && box.bottom <= s.innerHeight && box.bottom <= s.bottom + 1, `${sel} on screen without scrolling`).toBe(true);
	}
	if (c.draw) {
		expect.soft(s.top, `Draw step top ${s.top}: the board stays visible above`).toBeGreaterThanOrEqual(s.innerHeight * 0.5);
		const box = { x: s.left, y: s.top, right: s.right, bottom: s.bottom };
		expect.soft(intersects(box, await rectOf(page, '#zone-opponent')), 'the sheet covers the opponent row').toBe(false);
	}
	if (c.scrollIn === 'card') {
		expect.soft(s.scrollHeight, 'the sheet scrolls itself').toBeGreaterThan(s.clientHeight);
		expect.soft(s.overflowY, 'sheet overflow-y').toMatch(/auto|scroll/);
	} else if (scrollInner) {
		expect.soft(s.inner?.scrollHeight, `${scrollInner} scrolls`).toBeGreaterThan(s.inner?.clientHeight ?? 0);
		expect.soft(s.inner?.overflowY, `${scrollInner} overflow-y`).toMatch(/auto|scroll/);
	}
}

/** The detail view checks: a centred card inside the viewport, a big face, a Close that is on screen and big enough. */
async function expectDetail(page) {
	const vp = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
	const [d, face, close] = [await rectOf(page, '.card-detail'), await rectOf(page, '.card-detail .cd-preview .card'), await rectOf(page, '#modal-close-preview')];
	expect(d && face && close, 'dialog, face and Close exist').toBeTruthy();
	expect.soft(Math.abs(d.x + d.w / 2 - vp.w / 2), 'centre offset').toBeLessThanOrEqual(0.03 * vp.w);
	expect.soft(Math.min(d.x, vp.w - d.right, d.y, vp.h - d.bottom), 'smallest margin to the screen edge').toBeGreaterThanOrEqual(4);
	expect.soft(d.h, `dialog height ${d.h} of ${vp.h}`).toBeLessThanOrEqual(vp.h - 8);
	expect.soft(face.w, `face width ${face.w} of ${vp.w}`).toBeGreaterThanOrEqual(0.6 * vp.w);
	expect.soft(face.x >= 0 && face.right <= vp.w && face.y >= 0 && face.bottom <= vp.h, 'face inside the viewport').toBe(true);
	expect.soft(face.right <= d.right + 1 && face.bottom <= d.bottom + 1, 'face inside the dialog').toBe(true);
	expect.soft(close.w >= 44 && close.h >= 44, `Close ${close.w}x${close.h}`).toBe(true);
	expect.soft(close.y >= 0 && close.bottom <= vp.h && close.bottom <= d.bottom + 1, `Close on screen at open (bottom ${close.bottom} of ${vp.h})`).toBe(true);
	const covered = await page.evaluate(() => {
		const b = document.querySelector('#modal-close-preview').getBoundingClientRect();
		const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
		return !(hit && hit.closest('#modal-close-preview'));
	});
	expect.soft(covered, 'something covers the Close centre').toBe(false);
	expect.soft(d.bottom, 'detail is not a bottom sheet').toBeLessThanOrEqual(vp.h - 4);
	expect.soft(await undersized(page, '.card-detail button'), 'detail buttons under 44x44').toEqual([]);
	expect.soft((await pageOverflow(page)).x, 'page overflow x').toBeLessThanOrEqual(0);
	const sw = await page.evaluate(() => { const el = document.querySelector('.card-detail'); return el.scrollWidth - el.clientWidth; });
	expect.soft(sw, 'dialog sideways overflow').toBeLessThanOrEqual(0);
}

for (const vp of [...PHONE_VIEWPORTS, PIXEL_VIEWPORT]) {
	test.describe(`phone sheets at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
		});

		for (const c of SHEET_CASES) {
			test(`sheet: ${c.name}`, async ({ page }) => {
				await openModalBuilder(page, c.builder, c.args);
				await page.waitForTimeout(SETTLE);
				if (c.roll) { // a real tap on Roll with the die forced; the result stage appears after the 10 spin ticks
					await page.evaluate((n) => { window.__forceDiceRoll = n; }, c.roll);
					await page.locator('#modal-roll').tap();
					await expect(page.locator('.dice-modal[data-stage="result"]')).toHaveCount(1);
					await page.waitForTimeout(SETTLE);
				}
				await expectSheet(page, c);
			});
		}

		test('a real tap on a Draw step row answers it and closes the sheet', async ({ page }) => {
			await openModalBuilder(page, SHEET_CASES[0].builder, SHEET_CASES[0].args);
			await page.waitForTimeout(SETTLE);
			await expect(modalOpen(page)).toHaveCount(1);
			await page.locator('.modal-mosje-select-btn[data-id="draw"]').tap();
			await expect(modalOpen(page)).toHaveCount(0);
		});

		test('the text input sheet keeps its field and both buttons on screen', async ({ page }) => {
			await openModalBuilder(page, 'showTextInput', ['Name your Mosje', 'Type a name']);
			await page.waitForTimeout(SETTLE);
			for (const sel of ['#modal-text-input', '#modal-confirm', '#modal-cancel']) {
				const box = await rectOf(page, sel);
				expect.soft(box && box.y >= 0 && box.bottom <= vp.height && box.x >= 0 && box.right <= vp.width, `${sel} on screen`).toBe(true);
			}
		});

		for (const c of DETAIL_CASES) {
			test(`detail: ${c.name}`, async ({ page }) => {
				await openModalBuilder(page, 'showCardPreview', [c.card]);
				await page.waitForTimeout(SETTLE);
				await expectDetail(page);
				await page.locator('#modal-close-preview').tap(); // a real touch: the old Close sat below the screen edge
				await expect(modalOpen(page)).toHaveCount(0);
			});
		}

		test('a tap on the backdrop strip above the detail card closes it', async ({ page }) => {
			await openModalBuilder(page, 'showCardPreview', [DETAIL_CASES[0].card]);
			await page.waitForTimeout(SETTLE);
			expect((await rectOf(page, '.card-detail')).y, 'a backdrop strip above the card').toBeGreaterThanOrEqual(34);
			await page.locator('.modal-backdrop').tap({ position: { x: 20, y: 30 } });
			await expect(modalOpen(page)).toHaveCount(0);
		});

		test('a tall detail view scrolls inside itself and Close stays reachable', async ({ page }) => {
			await openModalBuilder(page, 'showCardPreview', [DETAIL_CASES[0].card]);
			await page.waitForTimeout(SETTLE);
			const box = async () => ({ close: await rectOf(page, '#modal-close-preview'), d: await rectOf(page, '.card-detail') });
			await page.evaluate(() => { document.querySelector('.card-detail').scrollTop = 0; });
			let b = await box();
			expect(b.close.bottom, 'Close on screen at the top of the scroll').toBeLessThanOrEqual(vp.height);
			await page.evaluate(() => { const el = document.querySelector('.card-detail'); el.scrollTop = el.scrollHeight; });
			b = await box();
			expect(b.close.y >= 0 && b.close.bottom <= vp.height, 'Close on screen at the bottom of the scroll').toBe(true);
		});

		test('the action spotlight is small, centred, tap-through and clear of the bar', async ({ page }) => {
			await page.evaluate(() => import('/src/ui/cardSpotlight.js').then((m) => m.showCardSpotlight({ cardId: 'mosje_alyssa_fissa', source: 'play', effects: [] })));
			await page.waitForTimeout(SETTLE);
			const spot = await rectOf(page, '.card-spotlight');
			expect(spot, 'a spotlight is on screen').not.toBeNull();
			expect(await page.locator('.card-spotlight').evaluate((el) => getComputedStyle(el).pointerEvents), 'pointer-events').toBe('none');
			expect(spot.w, `spotlight width ${spot.w}`).toBeLessThanOrEqual(0.5 * vp.width);
			expect(Math.abs(spot.x + spot.w / 2 - vp.width / 2), 'spotlight centre offset').toBeLessThanOrEqual(2);
			expect(spot.x >= 0 && spot.right <= vp.width && spot.y >= 0 && spot.bottom <= vp.height, 'inside the viewport').toBe(true);
			expect(intersects(spot, await rectOf(page, '#phone-bar')), 'the spotlight covers the bar').toBe(false);
		});
	});
}

test.describe('hover popup in a narrow mouse window', () => {
	test.use({ viewport: { width: 390, height: 844 }, hasTouch: false, isMobile: false });
	test('the .hover-zoom popup is hidden (display none)', async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page);
		await page.locator('#zone-player .card[data-card-id]').first().hover();
		await expect(page.locator('.hover-zoom'), 'the popup is built on hover').toHaveCount(1);
		expect(await page.locator('.hover-zoom').evaluate((el) => getComputedStyle(el).display)).toBe('none');
	});
});

test.describe('desktop 1920x1080 keeps centred dark modals', () => {
	test.use({ viewport: { width: 1920, height: 1080 } });
	test.beforeEach(async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page);
	});

	test('the Draw step is a centred card, not a bottom sheet', async ({ page }) => {
		await openModalBuilder(page, SHEET_CASES[0].builder, SHEET_CASES[0].args);
		await page.waitForTimeout(SETTLE);
		const s = await readSheet(page);
		expect(Math.abs((s.left + s.right) / 2 - 960), 'centre offset').toBeLessThan(2);
		expect(s.bottom, 'not on the bottom edge').toBeLessThan(s.innerHeight - 50);
		expect(s.width, 'card width').toBeLessThanOrEqual(480);
		expect(s.backAlpha, 'dark backdrop').toBeGreaterThanOrEqual(0.7);
	});

	test('the detail view stays a centred two column card', async ({ page }) => {
		await openModalBuilder(page, 'showCardPreview', [DETAIL_CASES[0].card]);
		await page.waitForTimeout(SETTLE);
		const d = await rectOf(page, '.card-detail');
		expect(Math.abs(d.x + d.w / 2 - 960), 'centre offset').toBeLessThan(2);
		const cols = await page.locator('.card-detail').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
		expect(cols, 'grid columns').toBe(2);
	});
});

test.describe('screenshots 390x844 and 1920x1080', () => {
	test.describe('phone', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('the Draw step sheet and the detail view over the board', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			await openModalBuilder(page, SHEET_CASES[0].builder, SHEET_CASES[0].args);
			await page.waitForTimeout(SETTLE);
			await page.screenshot({ path: `${SHOT_DIR}/65-08-phone-390x844.png` });
			await openModalBuilder(page, 'showCardPreview', [DETAIL_CASES[0].card]);
			await page.waitForTimeout(SETTLE);
			await page.screenshot({ path: `${SHOT_DIR}/65-08-detail-390x844.png` });
		});
	});
	test.describe('desktop', () => {
		test.use({ viewport: { width: 1920, height: 1080 } });
		test('a centred desktop modal', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page);
			await openModalBuilder(page, SHEET_CASES[0].builder, SHEET_CASES[0].args);
			await page.waitForTimeout(SETTLE);
			await page.screenshot({ path: `${SHOT_DIR}/65-08-desktop-1920x1080.png` });
		});
	});
});
