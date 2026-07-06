// onfield-ability-clamp.spec.js — Long ability text must not push the ability
// button out of an on-field owned Mosje card.
//
// Bug report (2026-07-06): Parkour West's long ability ("Adaptive Combat
// Flow: …") rendered un-clamped on the board card and shoved the ability
// button past the card's bottom edge. The text is now clamped to 4 lines
// (full text remains readable in the Mosje detail modal on click).
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField } from './helpers.js';

test.describe('On-field Mosje ability text clamp', () => {

	test('Parkour West on field: ability button stays fully inside the card', async ({ page }) => {
		await seedOfflineSession(page);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);

		// Force the worst-case long-ability Mosje into the player's slot 0.
		await setMosjeOnField(page, 'player_1', 0, 'mosje_parkour_west', { mp: 20, level: 0 });

		const card = page.locator('.mosje-card--owned').first();
		const btn = card.locator('.mosje-ability-btn');
		await expect(btn).toBeVisible();

		const cardBox = await card.boundingBox();
		const btnBox = await btn.boundingBox();
		// Let the card entry animation settle so the screenshot shows the real face.
		await page.waitForTimeout(1000);
		await card.screenshot({ path: 'tests/ui/screenshots/parkour-west-ability-clamp.png' });

		// The button (and a bit of breathing room) must sit inside the card.
		expect(btnBox.y + btnBox.height, 'ability button must not overflow the card bottom')
			.toBeLessThanOrEqual(cardBox.y + cardBox.height);

		// The ability text itself must be clipped, not spill freely.
		const overflow = await card.locator('.uc-ability').evaluate(el => getComputedStyle(el).overflow);
		expect(overflow).toBe('hidden');
	});
});
