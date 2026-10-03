import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, ss } from '../helpers.js';

test('arena-style hand hover, field hover popup and action spotlight', async ({ page }) => {
	page.on('pageerror', e => console.log('[PAGEERR]', e.message));
	await page.setViewportSize({ width: 1600, height: 900 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_michelle', { mp: 20, level: 0 });
	await page.mouse.move(5, 5);
	await page.waitForTimeout(700);
	await ss(page, 'arena-1-base');

	// 1. hand hover
	const hand = page.locator('.hand-card-wrap').nth(3);
	await hand.hover({ position: { x: 100, y: 30 } });
	await page.waitForTimeout(700);
	await ss(page, 'arena-2-hand-hover');

	// 2. field hover (opponent)
	await page.locator('.mosje-card--opponent').first().hover();
	await page.waitForTimeout(300);
	await expect(page.locator('.hover-zoom')).toHaveCount(1);
	await ss(page, 'arena-3-field-hover');
	await page.mouse.move(5, 5);
	await expect(page.locator('.hover-zoom')).toHaveCount(0);

	// 3. spotlight: simulate an ability activation + MP loss via the real animation API
	await page.evaluate(async () => {
		const m = await import('/src/ui/actionAnimations.js');
		const before = JSON.parse(JSON.stringify(window.__testHooks.getGameState()));
		const after = JSON.parse(JSON.stringify(before));
		after.players.player_2.activeSlots[0].mp -= 15;
		after.players.player_1.activeSlots[0].mp += 10;
		m.animateFieldActivation({ zone: 'mosje', playerId: 'player_1', slotIndex: 0, cardId: 'mosje_michelle' });
		m.animateStateDelta(before, after, {});
	});
	await page.waitForTimeout(900);
	await expect(page.locator('.card-spotlight')).toHaveCount(1);
	await ss(page, 'arena-4-spotlight');
	await page.waitForTimeout(2800);
	await expect(page.locator('.card-spotlight')).toHaveCount(0);
});
