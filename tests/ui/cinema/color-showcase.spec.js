/**
 * color-showcase.spec.js — a visual palette board: one of every card type in hand
 * (Mosje=gold, Piecie=blue, Snelle=light-blue, Place=green, Quest=purple) plus a
 * Mosje and an active Place on the field. Holds so the whole colour-style is visible.
 *   npx playwright test --project=visual tests/ui/cinema/color-showcase.spec.js --headed
 */

import { test } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setMosjeOnField, setHand, playCardFromHand, unlockPiecies,
} from '../helpers.js';

test('🎨 Colour showcase — every card type in hand + on field', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const HOLD = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 9000 : 0);

	await seedCustomDeck(page, {
		id: 'custom_cinema_palette', name: 'Colour Palette',
		mosjes: ['mosje_alyssa_bulldozer', 'mosje_youri'],
		piecies: ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: ['place_the_gym'],
		quests: ['quest_personal_winston_tijd'],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Field: a Mosje (gold) ...
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });

	// ... and an active Place (green): play face-down → unlock → activate.
	await setHand(page, 'player_1', ['place_the_gym', 'piecie_redbull']);
	await page.waitForTimeout(200);
	await playCardFromHand(page, 'place_the_gym');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.waitForTimeout(150);
	const act = page.locator('#piecies-player [data-card-id="place_the_gym"] button:has-text("Activate")').first();
	if (await act.isVisible({ timeout: 4000 }).catch(() => false)) { await act.click(); await page.waitForTimeout(500); }

	// Play a Piecie to the field (blue), too.
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(150);
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);

	// Hand: one of EVERY type — all five frame colours side by side.
	await setHand(page, 'player_1', [
		'mosje_youri',                 // gold
		'piecie_kannetje_melk',        // blue
		'snelle_jensen',               // light sky-blue
		'place_the_gym',               // green
		'quest_personal_winston_tijd', // purple
	]);
	await page.waitForTimeout(500);
	await ss(page, 'color-showcase');
	console.log('🎨 Showcase ready — field: Mosje + active Place + Piecie | hand: every type, every colour');
	if (HOLD) await page.waitForTimeout(HOLD);
});
