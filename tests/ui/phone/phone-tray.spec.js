/**
 * phone-tray.spec.js - Phase 72.1-04 (D-04, MOB-04; CC-13): with a Personal Quest in hand and a Mosje that has an ability, an own
 * tile's tray holds FIVE chips (Attack, Quest, Personal Quest, Ability, Details). The tray stays inside the band between the status
 * strip and the bottom bar, every chip is at least 44 px high and 100 px wide, no two overlap, and a tap on Details opens the detail.
 * The Place tile: its owner chip ("YOU - 0 turns") sits beside the tile, never over the Place name, and stays readable. 395x731,
 * 390x844, 360x740, touch, headless.
 */
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { seedActionsBoard } from '../../helpers/phoneActionsBoard.js';
import { setHand } from '../../ui/helpers.js';
import { tapOwnCard, chooseTray } from '../../helpers/boardTaps.js';
import { expectTrayChips } from '../../helpers/expectTrayChips.js';
import { expectInFreeBand } from '../../helpers/expectInFreeBand.js';
import { intersects, rectOf } from '../../helpers/phoneGeometry.js';

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone tray and Place at ${vp.name}`, () => {
		test.use(phoneUse(vp));

		test('(a) five chips fit the band between strip and bar; Details opens the detail', async ({ page }) => {
			await seedActionsBoard(page);
			await setHand(page, 'player_1', ['pq_charge']);
			await page.waitForTimeout(300);
			await tapOwnCard(page, 'mosje', 1, { touch: true }); // slot 1: Ming, an activated ability
			const labels = await page.locator('[data-action-tray] [data-action]').evaluateAll((els) => els.map((el) => el.dataset.action));
			expect(labels, 'the five chips in order').toEqual(['attack', 'quest', 'personalQuest', 'ability', 'details']);
			await expectTrayChips(page, 5, 100);
			await expectInFreeBand(page, '[data-action-tray]', { side: 0, gap: 0 });
			await chooseTray(page, 'details', { touch: true });
			await expect(page.locator('.modal-root--open')).toContainText('Ming');
		});

		test('(b) Place tile: the owner chip does not cover the Place name; the numbers are reported', async ({ page }) => {
			await seedActionsBoard(page); // my Drain Zone is the active Place
			const place = await rectOf(page, '#board-place .card');
			const name = await rectOf(page, '#board-place .cv2-tile-name');
			const chip = await rectOf(page, '#board-place .place-owner-chip');
			const font = await page.locator('#board-place .place-owner-chip').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
			console.log(`[72.1-04] ${vp.name}: Place tile ${place.w}x${place.h}, name ${name.w}x${name.h}, chip ${chip.w}x${chip.h} at ${chip.x},${chip.y}, chip font ${font}`);
			expect(name, 'Place name box').not.toBeNull();
			expect(chip, 'owner chip').not.toBeNull();
			expect(intersects(chip, name), 'the owner chip does not overlap the Place name').toBe(false);
			expect(font, 'owner chip text at least 10 px').toBeGreaterThanOrEqual(10);
			const screen = await page.evaluate(() => ({ w: window.innerWidth }));
			expect(chip.x >= 0 && chip.right <= screen.w, `the chip is inside the screen (${chip.x}..${chip.right})`).toBe(true);
			const chipText = await page.locator('#board-place .place-owner-chip').evaluate((el) => el.scrollWidth - el.clientWidth);
			expect(chipText, 'the chip text is not cut (ellipsis aside, it fits or ellipsizes inside its box)').toBeLessThanOrEqual(1);
		});
	});
}
