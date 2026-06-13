/**
 * hover-detail.spec.js — verify the on-hover detail popover (full card info).
 *   npx playwright test --project=visual tests/ui/cinema/hover-detail.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setMosjeOnField, setHand,
} from '../helpers.js';

test('🔍 Hover detail — Mosje shows traits / ability / synergy', async ({ page }) => {
	test.setTimeout(120000);
	await seedCustomDeck(page, {
		id: 'custom_hover_detail', name: 'Hover Detail',
		mosjes: ['mosje_alyssa_bulldozer', 'mosje_youri'],
		piecies: ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: ['place_the_gym'], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setHand(page, 'player_1', ['mosje_youri', 'piecie_redbull', 'snelle_jensen']);
	await page.waitForTimeout(300);

	// Hover the field Mosje → detail popover appears.
	await page.locator('.mosje-card--owned[data-card-id="mosje_alyssa_bulldozer"]').hover();
	await page.waitForTimeout(3000);
	const detail = page.locator('.card-hover-detail');
	await expect(detail).toBeVisible();
	await ss(page, 'hover-detail-mosje');
	console.log('🔍 Mosje hover detail shown');

	// Hover a hand Piecie too.
	await page.locator('.hand-card[data-card-id="piecie_redbull"]').hover();
	await page.waitForTimeout(3000);
	await ss(page, 'hover-detail-piecie');
});
