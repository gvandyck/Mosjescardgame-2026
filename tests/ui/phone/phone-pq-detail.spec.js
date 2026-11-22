/**
 * phone-pq-detail.spec.js - Phase 72.1-06 Task 2 (D-06, D-04): the Personal Quest detail on a phone. For every Personal Quest in the
 * hand, opened through the raise dock's Details button: the dialog scrolls inside itself, the page does not, and Play, the reason line
 * (when Play is off) and Close are all inside the viewport WITHOUT scrolling the dialog, each at least 44 px high; the reason is shown in
 * full; a strip of backdrop of at least 36 px remains above and below. With a Level 3 Mosje Play is enabled and opens the Mosje pick.
 * Regression: the Mosje detail still has a reachable Close. 395x731, 390x844, 360x740, real taps.
 */
import { test, expect } from '@playwright/test';
import { setMosjeOnField, clearEntryProtection } from '../helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../../helpers/phoneBoard.js';
import { raiseCard } from '../../helpers/phoneRaise.js';

const NO_L3 = 'You have no Level 3 Mosje';

const pqIds = (page) => page.evaluate(async () => (await import('/src/data/personalQuests.js')).PERSONAL_QUESTS.map((q) => q.id));

/** Geometry of the open detail dialog, read from the live DOM. */
const readDetail = (page) => page.evaluate(() => {
	const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height, left: r.left, right: r.right }; };
	const dlg = document.querySelector('.card-detail');
	const doc = document.scrollingElement;
	const why = dlg.querySelector('.cd-why');
	return {
		ih: window.innerHeight, iw: window.innerWidth,
		dlg: box(dlg), play: box(dlg.querySelector('.cd-action')), close: box(dlg.querySelector('.cd-close')), why: box(why),
		whyClamped: why ? why.scrollHeight > why.clientHeight + 1 : false,
		docScroll: doc.scrollHeight, scrollTop: doc.scrollTop, dlgScrolls: dlg.scrollHeight > dlg.clientHeight,
	};
});

function expectReachable(d, id, withWhy) {
	const inView = (b) => b.top >= -0.5 && b.bottom <= d.ih + 0.5;
	expect(d.play, `${id}: Play exists`).not.toBeNull();
	expect(inView(d.play), `${id}: Play is inside the viewport without scrolling`).toBe(true);
	expect(inView(d.close), `${id}: Close is inside the viewport`).toBe(true);
	expect(d.play.h, `${id}: Play >= 44 px`).toBeGreaterThanOrEqual(43.5);
	expect(d.close.h, `${id}: Close >= 44 px`).toBeGreaterThanOrEqual(43.5);
	expect(d.play.bottom, `${id}: Play sits above Close`).toBeLessThanOrEqual(d.close.top + 0.5);
	if (withWhy) {
		expect(d.why, `${id}: the reason line is shown`).not.toBeNull();
		expect(inView(d.why), `${id}: the reason is inside the viewport`).toBe(true);
		expect(d.whyClamped, `${id}: the reason is not clamped`).toBe(false);
	}
	expect(d.docScroll, `${id}: the page does not scroll`).toBeLessThanOrEqual(d.ih);
	expect(d.scrollTop).toBe(0);
	expect(d.dlg.top, `${id}: a backdrop strip of 36 px above`).toBeGreaterThanOrEqual(35.5);
	expect(d.ih - d.dlg.bottom, `${id}: a backdrop strip of 36 px below`).toBeGreaterThanOrEqual(35.5);
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone Personal Quest detail at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('(a) every Personal Quest: Play, the reason and Close stay reachable without scrolling', async ({ page }) => {
			test.setTimeout(180000);
			await seedPhoneBoard(page, { hand: [], energy: 6 });
			const ids = await pqIds(page);
			expect(ids.length).toBeGreaterThanOrEqual(11);
			let tallest = { id: '', h: 0 };
			for (const id of ids) {
				await page.evaluate((cardId) => window.__testHooks.setHand('player_1', [cardId]), id);
				await page.waitForTimeout(250);
				await raiseCard(page, id);
				await page.locator('[data-raise-details]').tap();
				await expect(page.locator('.card-detail')).toBeVisible();
				await page.waitForTimeout(350);
				const d = await readDetail(page);
				expectReachable(d, id, true);
				const full = await page.evaluate(() => document.querySelector('.card-detail').scrollHeight);
				if (full > tallest.h) tallest = { id, h: full };
				await expect(page.locator('.card-detail .cd-why')).toContainText(NO_L3);
				await page.locator('#modal-close-preview').tap();
				await expect(page.locator('.modal-root--open')).toHaveCount(0);
				await page.locator('#phone-bar [data-raise-cancel]').tap();
			}
			console.log(`[72.1-06] ${vp.name}: tallest Personal Quest detail ${tallest.id} (${Math.round(tallest.h)} px)`);
		});

		test('(b) with a Level 3 Mosje Play is enabled, pinned, and a tap opens the Mosje pick', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: ['pq_charge'], energy: 6 });
			await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
			await clearEntryProtection(page);
			await page.waitForTimeout(400);
			await raiseCard(page, 'pq_charge');
			await page.locator('[data-raise-details]').tap();
			await expect(page.locator('.card-detail')).toBeVisible();
			await page.waitForTimeout(900);
			expectReachable(await readDetail(page), 'pq_charge', false);
			const play = page.locator('.card-detail .cd-action');
			await expect(play).toBeEnabled();
			await play.tap();
			await expect(page.locator('.modal-mosje-select-btn').first()).toBeVisible();
		});

		test('(c) the Mosje detail still has its Close reachable (regression)', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: [], energy: 6 });
			await page.locator('#zone-player [data-zone="mosje"][data-slot-index="1"]').tap();
			await page.locator('[data-action-tray] >> text=Details').first().tap();
			await expect(page.locator('.card-detail')).toBeVisible();
			await page.waitForTimeout(350);
			const d = await readDetail(page);
			expect(d.close.bottom).toBeLessThanOrEqual(d.ih + 0.5);
			expect(d.close.h).toBeGreaterThanOrEqual(43.5);
		});
	});
}
