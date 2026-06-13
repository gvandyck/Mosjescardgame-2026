/**
 * mobile-hand.spec.js — screenshot the hand at phone width to check the fan layout.
 *   npx playwright test --project=visual tests/ui/cinema/mobile-hand.spec.js --headed
 */

import { test } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss, setHand, setMosjeOnField,
} from '../helpers.js';

test.use({ viewport: { width: 390, height: 844 } });   // iPhone-ish portrait

test('📱 Hand at phone width', async ({ page }) => {
	test.setTimeout(120000);
	await seedCustomDeck(page, {
		id: 'custom_mobile_hand', name: 'Mobile Hand',
		mosjes: ['mosje_alyssa_bulldozer', 'mosje_youri'],
		piecies: ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: ['place_the_gym'],
		quests: ['quest_personal_winston_tijd'],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setHand(page, 'player_1', [
		'mosje_youri', 'piecie_redbull', 'piecie_kannetje_melk',
		'snelle_jensen', 'place_the_gym', 'quest_personal_winston_tijd',
	]);
	await page.waitForTimeout(400);
	await ss(page, 'mobile-hand');
	console.log('📱 Mobile hand captured (390px wide)');
});
