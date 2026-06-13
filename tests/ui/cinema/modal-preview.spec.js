/**
 * modal-preview.spec.js — screenshots the card-click detail modal for each type,
 * for design iteration. Run headed to watch:
 *   npx playwright test --project=visual tests/ui/cinema/modal-preview.spec.js --headed
 */

import { test } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss, setHand,
} from '../helpers.js';

const HAND = ['mosje_youri', 'piecie_redbull', 'snelle_jensen', 'place_the_gym', 'quest_personal_winston_tijd'];

test('🪟 Card-click modal — each type', async ({ page }) => {
	test.setTimeout(120000);
	await seedCustomDeck(page, {
		id: 'custom_modal_preview', name: 'Modal Preview',
		mosjes: ['mosje_youri', 'mosje_alyssa_bulldozer'],
		piecies: ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: ['place_the_gym'],
		quests: ['quest_personal_winston_tijd'],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', HAND);
	await page.waitForTimeout(300);

	for (const [label, id] of [['mosje', 'mosje_youri'], ['piecie', 'piecie_redbull'], ['place', 'place_the_gym'], ['quest', 'quest_personal_winston_tijd']]) {
		// Click the card art area (not the play button) to open the preview modal.
		const card = page.locator(`.hand-card[data-card-id="${id}"]`);
		await card.click({ position: { x: 30, y: 30 } });
		await page.locator('.card-detail').waitFor({ state: 'visible', timeout: 5000 });
		await page.waitForTimeout(400);
		await ss(page, `modal-${label}`);
		console.log(`🪟 ${label} modal captured`);
		// Close and wait for the modal to fully detach before the next card.
		await page.locator('#modal-close-preview').click({ force: true }).catch(() => {});
		await page.locator('.card-detail').waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
		await page.waitForTimeout(200);
	}
});
