/**
 * phone-touch-hygiene.spec.js - Phase 72.1-10 (D-04, D-12): the page does not fight the game's own touches. At 395x731, 390x844 and
 * 360x740 (computed styles): the table (board, hand panel, header, status strip) allows only pan-x pan-y (no pinch, no double-tap
 * zoom); modals, sheets and the detail view keep the default so a card can still be zoomed to read it; html and body keep
 * overscroll-behavior none; the viewport meta has viewport-fit=cover and no zoom lock; the body does not scroll; a two-finger pinch
 * over the board does not change visualViewport.scale; the tap highlight is transparent.
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from '../helpers.js';

const VIEWPORTS = [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS];
const TABLE = ['.game-board', '.game-hand-panel', '.game-topbar', '#status-strip'];

async function pinch(page, x, y) {
	const cdp = await page.context().newCDPSession(page);
	const pt = (id, dx) => ({ x: x + dx, y, id });
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(1, -20), pt(2, 20)] });
	for (let d = 30; d <= 120; d += 15) {
		await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(1, -d), pt(2, d)] });
	}
	await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
	await page.waitForTimeout(150);
}

for (const vp of VIEWPORTS) {
	test.describe(`Touch hygiene ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('touch-action, overscroll, viewport meta, no scroll, no pinch on the table', async ({ page }) => {
			await seedOfflineSession(page);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);

			for (const sel of TABLE) {
				const ta = await page.locator(sel).first().evaluate((el) => getComputedStyle(el).touchAction);
				expect.soft(ta, `${sel} touch-action`).toBe('pan-x pan-y');
			}
			// The bar keeps pinch-zoom (65-03b, phone-hand-drawer.spec): a one-finger drag there is the drawer swipe, never a browser pan.
			expect.soft(await page.locator('#phone-bar').evaluate((el) => getComputedStyle(el).touchAction), '#phone-bar touch-action').toBe('pinch-zoom');
			for (const prop of ['html', 'body']) {
				const o = await page.locator(prop).evaluate((el) => getComputedStyle(el).overscrollBehaviorY);
				expect.soft(o, `${prop} overscroll-behavior`).toBe('none');
			}
			const meta = await page.locator('meta[name=viewport]').getAttribute('content');
			expect(meta).toContain('viewport-fit=cover');
			expect(meta).not.toMatch(/maximum-scale|user-scalable/);
			const scroll = await page.evaluate(() => ({ sh: document.body.scrollHeight, ch: document.body.clientHeight, dsh: document.documentElement.scrollHeight, dch: document.documentElement.clientHeight }));
			expect(scroll.sh).toBeLessThanOrEqual(scroll.ch);
			expect(scroll.dsh).toBeLessThanOrEqual(scroll.dch);
			const hl = await page.locator('body').evaluate((el) => getComputedStyle(el).webkitTapHighlightColor);
			expect(hl).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);

			const scale0 = await page.evaluate(() => window.visualViewport.scale);
			await pinch(page, vp.width / 2, vp.height / 2);
			const scale1 = await page.evaluate(() => window.visualViewport.scale);
			expect(scale1, 'pinch over the board').toBe(scale0);
		});

		test('modals, sheets and the detail view keep the default touch-action', async ({ page }) => {
			await seedOfflineSession(page);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			const styles = await page.evaluate(() => {
				const root = document.getElementById('modal-root');
				const out = {};
				for (const cls of ['modal-card', 'phone-sheet', 'card-detail']) {
					const el = document.createElement('div');
					el.className = cls;
					root.appendChild(el);
					out[cls] = getComputedStyle(el).touchAction;
					el.remove();
				}
				return out;
			});
			for (const [cls, ta] of Object.entries(styles)) expect.soft(ta, `.${cls} touch-action`).toBe('auto');
		});
	});
}
