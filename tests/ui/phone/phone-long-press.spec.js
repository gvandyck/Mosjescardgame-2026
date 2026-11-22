/**
 * phone-long-press.spec.js - Phase 72.1-05 (D-06, T-72.1-10): a long press (500 ms, under 10 px of movement) on a hand card opens its
 * card sheet (72.1-06; Details is its "Full card" button) and never raises, plays or pays; a short tap raises; a swipe, a touchcancel or a scroll does neither. The real Chrome
 * sequence of 65-03b (a pointercancel ~15 ms in, then more touchmoves and a late touchend) still opens the sheet. A mouse press-and-hold
 * on desktop opens nothing. Real CDP touches through the `phone` project at 395x731, 390x844 and 360x740.
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../../helpers/phoneBoard.js';
import { openDrawer, wrapOf, FISSA, KANNETJE, DONER, FREE_SNELLE, RAISE_HAND } from '../../helpers/phoneRaise.js';
import { longPress } from '../../helpers/phoneLongPress.js';

const detail = (page) => page.locator('.phone-sheet'); // 72.1-06: the long press opens the card sheet, no longer the Details view
const raised = (page) => page.locator('.hand-card-wrap[data-raised]');

async function centerOf(page, cardId) {
	await wrapOf(page, cardId).scrollIntoViewIfNeeded(); // the hand strip scrolls sideways: bring the card on screen first
	await page.waitForTimeout(200);
	const box = await wrapOf(page, cardId).locator('.hand-card').first().boundingBox();
	return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Hand size, Energy and Mosje slot 0: what a play or a payment would change. */
const snapshot = (page) => page.evaluate(() => {
	const p = window.__testHooks.getGameState().players.player_1;
	return { hand: p.hand.length, energy: p.energy, mosje0: p.activeSlots[0]?.cardId ?? null, piecie1: p.piecieSlots[1]?.cardId ?? null };
});

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone long press at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: RAISE_HAND, energy: 6 });
			await openDrawer(page);
		});

		test('(a) a 600 ms hold opens the card sheet and does not raise, play or pay', async ({ page }) => {
			const before = await snapshot(page);
			await longPress(page, { at: await centerOf(page, FISSA), holdMs: 600 });
			await expect(detail(page)).toBeVisible();
			await expect(detail(page)).toContainText('Alyssa');
			await page.waitForTimeout(900); // the swallowed click must not close it, raise anything or play
			await expect(detail(page)).toBeVisible();
			await expect(raised(page)).toHaveCount(0);
			await expect(page.locator('#phone-bar')).not.toHaveAttribute('data-mode', 'raise');
			expect(await snapshot(page), 'nothing played, nothing paid').toEqual(before);
		});

		test('(b) a hold released at 300 ms is a tap: it raises and opens no sheet', async ({ page }) => {
			await longPress(page, { at: await centerOf(page, FISSA), holdMs: 300 });
			await expect(page.locator('#phone-bar')).toHaveAttribute('data-mode', 'raise');
			await expect(raised(page)).toHaveCount(1);
			await expect(detail(page)).toHaveCount(0);
		});

		test('(c) a 25 px swipe neither opens Details nor raises, and the strip scrolls', async ({ page }) => {
			const strip = () => page.evaluate(() => document.getElementById('hand-root').scrollLeft);
			const start = await centerOf(page, DONER);
			const scrollBefore = await strip();
			expect(scrollBefore, 'the strip is scrolled right, so a finger moving right can scroll it back').toBeGreaterThan(20);
			await longPress(page, { at: start, moveTo: { x: start.x + 60, y: start.y }, steps: 6, holdMs: 700 });
			await page.waitForTimeout(500);
			await expect(detail(page)).toHaveCount(0);
			await expect(raised(page)).toHaveCount(0);
			expect(await strip(), 'the strip scrolled back to the left').toBeLessThan(scrollBefore);
		});

		test('(d) a touchcancel mid-hold does nothing', async ({ page }) => {
			const before = await snapshot(page);
			await longPress(page, { at: await centerOf(page, KANNETJE), cancelAtMs: 250 });
			await page.waitForTimeout(800);
			await expect(detail(page)).toHaveCount(0);
			await expect(raised(page)).toHaveCount(0);
			expect(await snapshot(page)).toEqual(before);
		});

		test('(e) the real Chrome sequence: a pointercancel at 15 ms, small drift, a late touchend still opens the sheet', async ({ page }) => {
			const at = await centerOf(page, FREE_SNELLE);
			await longPress(page, {
				at, moveTo: { x: at.x + 4, y: at.y + 3 }, steps: 3, holdMs: 600,
				afterFirstMove: () => wrapOf(page, FREE_SNELLE).locator('.hand-card').first().evaluate((el) => el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerType: 'touch' }))),
			});
			await expect(detail(page)).toBeVisible();
			await expect(raised(page)).toHaveCount(0);
		});

		test('(f) the browser context menu is prevented on a hand card', async ({ page }) => {
			const prevented = await wrapOf(page, FISSA).locator('.hand-card').first().evaluate((el) => {
				const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
				el.dispatchEvent(ev);
				return ev.defaultPrevented;
			});
			expect(prevented).toBe(true);
		});

		test('(g) a second finger cancels the hold', async ({ page }) => {
			const at = await centerOf(page, FISSA);
			const cdp = await page.context().newCDPSession(page);
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y, id: 1 }] });
			await page.waitForTimeout(150);
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y, id: 1 }, { x: at.x + 30, y: at.y, id: 2 }] });
			await page.waitForTimeout(700);
			await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
			await cdp.detach();
			await page.waitForTimeout(300);
			await expect(detail(page)).toHaveCount(0);
		});
	});
}

test.describe('desktop guard: a mouse press-and-hold opens nothing special', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });
	test('hold the mouse 700 ms on a hand card, release away from it: no detail view, nothing played', async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page, { hand: [FISSA, KANNETJE], energy: 6 });
		const before = await snapshot(page);
		const box = await wrapOf(page, FISSA).locator('.hand-card').first().boundingBox();
		await page.mouse.move(box.x + box.width / 2, box.y + 40);
		await page.mouse.down();
		await page.waitForTimeout(700);
		await expect(detail(page)).toHaveCount(0);
		await page.mouse.move(box.x + box.width / 2, 300);
		await page.mouse.up();
		await page.waitForTimeout(300);
		await expect(detail(page)).toHaveCount(0);
		expect(await snapshot(page)).toEqual(before);
	});
});
