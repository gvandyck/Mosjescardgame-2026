/**
 * phone-back-gesture.spec.js - Phase 72.1-10 (D-04, D-09): the browser Back action in a running phone game, at 395x731, 390x844 and
 * 360x740. page.goBack() runs the same history traversal as the Android edge swipe and fires popstate. During play Back keeps the URL
 * and shows "Leave the game?" (two options >= 48 px high); Keep playing leaves the state untouched and asks again next time; Leave
 * goes to the previous page; after game over Back leaves without asking. A desktop context (mouse, 1920x1080) is untouched: Back
 * leaves at once and the game start adds no history entry.
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState } from '../helpers.js';

const VIEWPORTS = [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS];
const PREV = '/index.html?prev=1';

async function openGame(page) {
	await seedOfflineSession(page);
	await page.goto(PREV, { waitUntil: 'domcontentloaded' });
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
}

const confirmSheet = (page) => page.locator('.modal-root--open .modal-card', { hasText: 'Leave the game?' });

async function snapshot(page) {
	const gs = await getGameState(page);
	return JSON.stringify({ turn: gs.turn ?? gs.turnNumber, active: gs.activePlayerId, hand: gs.players.player_1.hand.length, energy: gs.players.player_1.energy });
}

for (const vp of VIEWPORTS) {
	test.describe(`Back gesture ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('Back asks, Keep playing changes nothing, asks again, Leave goes to the previous page', async ({ page }) => {
			await openGame(page);
			const url = page.url();
			const before = await snapshot(page);

			await page.goBack().catch(() => {});
			await expect(confirmSheet(page)).toBeVisible();
			expect(page.url()).toBe(url);
			const opts = confirmSheet(page).locator('button');
			expect(await opts.count()).toBe(2);
			for (let i = 0; i < 2; i += 1) {
				const box = await opts.nth(i).boundingBox();
				expect(box.height).toBeGreaterThanOrEqual(48);
			}
			if (vp === PIXEL_VIEWPORT) await savePhoneShot(page, '72.1-10-leave-confirm');

			await confirmSheet(page).getByRole('button', { name: 'Keep playing' }).click();
			await expect(confirmSheet(page)).toHaveCount(0);
			expect(page.url()).toBe(url);
			expect(await snapshot(page)).toBe(before);

			await page.goBack().catch(() => {});
			await expect(confirmSheet(page)).toBeVisible();
			await confirmSheet(page).getByRole('button', { name: 'Leave' }).click();
			await page.waitForURL(/index\.html\?prev=1/);
		});

		test('after game over Back leaves without a confirm', async ({ page }) => {
			await openGame(page);
			await page.evaluate(() => window.__testHooks.forceKnockout('player_2'));
			await expect(page.locator('#reward-overlay')).toBeVisible({ timeout: 15000 });
			await page.goBack();
			await page.waitForURL(/index\.html\?prev=1/);
		});
	});
}

test.describe('Back gesture desktop guard', () => {
	test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

	test('Back leaves at once and the game start pushes no history', async ({ page }) => {
		await seedOfflineSession(page);
		await page.goto(PREV, { waitUntil: 'domcontentloaded' });
		const lenBefore = await page.evaluate(() => history.length);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);
		expect(await page.evaluate(() => history.length)).toBe(lenBefore + 1);
		expect(await page.evaluate(() => history.state)).toBeNull();
		await page.goBack();
		await page.waitForURL(/index\.html\?prev=1/);
		await expect(page.locator('.modal-card', { hasText: 'Leave the game?' })).toHaveCount(0);
	});
});
