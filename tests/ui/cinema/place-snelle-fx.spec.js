/**
 * place-snelle-fx.spec.js — "Cinema mode" demo of the category-coloured effects
 * for a Place (green, on activation) and a Snelle Piecie (red, instant).
 *   npx playwright test --project=visual tests/ui/cinema/place-snelle-fx.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setMosjeOnField, setHand, playCardFromHand, unlockPiecies, getGameState,
} from '../helpers.js';

test('🎬 Place (green) + Snelle (light-blue) effect colours', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2400 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	await seedCustomDeck(page, {
		id: 'custom_cinema_placesnelle', name: 'Place+Snelle Cinema',
		mosjes: ['mosje_alyssa_bulldozer'],
		piecies: ['piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: ['place_the_gym'], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 1 });
	await setHand(page, 'player_1', ['place_the_gym', 'snelle_jensen', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(300);
	await ss(page, 'placesnelle-1-start');
	await beat('Scene 1 — hand holds a Place (The Gym) and a Snelle (Jensen)');

	// ── Place → played face-down, then ACTIVATED → GREEN ──────────────────────
	await beat('Scene 2 — playing The Gym (Place) face-down…');
	await playCardFromHand(page, 'place_the_gym');
	await page.waitForTimeout(600);
	await unlockPiecies(page, 'player_1');           // make it activatable this turn
	await page.waitForTimeout(200);
	const activateBtn = page.locator('#piecies-player [data-card-id="place_the_gym"] button:has-text("Activate")').first();
	await activateBtn.waitFor({ state: 'visible', timeout: 5000 });
	await activateBtn.click();
	await page.waitForTimeout(700);
	await ss(page, 'placesnelle-2-place');
	await beat('🟢 Place activated — GREEN burst');
	expect((await getGameState(page))?.activePlace).toBe('place_the_gym');

	// ── Snelle → RED ──────────────────────────────────────────────────────────
	await beat('Scene 3 — playing Jensen (Snelle Piecie)…');
	await playCardFromHand(page, 'snelle_jensen');
	await page.waitForTimeout(700);
	await ss(page, 'placesnelle-3-snelle');
	await beat('🩵 Snelle played — light-blue burst');
	const hand = (await getGameState(page))?.players?.player_1?.hand || [];
	expect(hand.some(c => (c.cardId || c.id) === 'snelle_jensen')).toBe(false);
	await beat('🎬 fin');
});
