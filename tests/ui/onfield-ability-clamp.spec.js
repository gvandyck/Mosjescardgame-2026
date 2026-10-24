// onfield-ability-clamp.spec.js — Long ability text must not push the ability
// button out of an on-field owned Mosje card.
// 63-06: the Ability button is a chip in the action tray now; the same intent is checked there: the tile carries no button,
// and the chip's label fits inside the chip and the chip inside the screen.
//
// (58-03: Parkour West is a passive ability in 2.0 and has no button, so the layout check uses Ronald Chef, an activated Mosje.)
// Bug report (2026-07-06): Parkour West's long ability ("Adaptive Combat
// Flow: …") rendered un-clamped on the board card and shoved the ability
// button past the card's bottom edge. The text is now clamped to 4 lines
// (full text remains readable in the Mosje detail modal on click).
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField } from './helpers.js';
import { tapOwnCard } from '../helpers/boardTaps.js';

test.describe('On-field Mosje ability text clamp', () => {

	test('Parkour West on field: ability button stays fully inside the card', async ({ page }) => {
		await seedOfflineSession(page);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);

		// Force the worst-case long-ability Mosje into the player's slot 0.
		await setMosjeOnField(page, 'player_1', 0, 'mosje_ronald_chef', { mp: 20, level: 1 });

		const card = page.locator('.mosje-card--owned').first();
		// Let the card entry animation settle so the screenshot shows the real face.
		await page.waitForTimeout(1000);
		await card.screenshot({ path: 'tests/ui/screenshots/parkour-west-ability-clamp.png' });

		// No Ability button on the tile; it is a chip in the tray that opens when the Mosje is tapped.
		await expect(card.locator('button')).toHaveCount(0);
		await tapOwnCard(page, 'mosje', 'mosje_ronald_chef');
		const chip = page.locator('[data-action-tray] [data-action="ability"]');
		await expect(chip).toBeVisible();

		// The label fits inside the chip (not clipped), and the chip sits fully on screen.
		const fit = await chip.evaluate(el => ({ scroll: el.scrollWidth, client: el.clientWidth }));
		expect(fit.scroll, 'ability label must not overflow its chip').toBeLessThanOrEqual(fit.client);
		const chipBox = await chip.boundingBox();
		const view = page.viewportSize();
		expect(chipBox.x).toBeGreaterThanOrEqual(0);
		expect(chipBox.y).toBeGreaterThanOrEqual(0);
		expect(chipBox.x + chipBox.width, 'ability chip must not leave the screen').toBeLessThanOrEqual(view.width);
		expect(chipBox.y + chipBox.height, 'ability chip must not leave the screen').toBeLessThanOrEqual(view.height);

		// Old (unified) face only: the ability text itself must be clipped, not spill
		// freely. Card frame v1 field tiles carry no ability text at all.
		const abilityText = card.locator('.uc-ability');
		if (await abilityText.count()) {
			const overflow = await abilityText.evaluate(el => getComputedStyle(el).overflow);
			expect(overflow).toBe('hidden');
		}
	});
});
