/**
 * redbull-coert.spec.js — Redbull double-triggers Coert's cost-bearing ability.
 *
 * Bug repro (reported 2026-06-17): with Redbull active, using Coert's "Extra
 * Resources" (pay 10 MP, draw 1) only drew ONE card. Coert was on the engine's
 * NO_DOUBLE_ABILITIES exclusion list, so the echo was silently skipped and the
 * Redbull flag was consumed for nothing.
 *
 * Ruling (user, 2026-06-17): Redbull should make it "trigger TWICE" properly —
 * pay 10 MP again and draw a second card. Coert's ability self-charges its cost,
 * so a plain re-run naturally pays again; removing it from NO_DOUBLE_ABILITIES
 * yields the correct behaviour.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-coert.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	seedCustomDeck, waitForBoard, ss,
	setMosjeMP, playCardFromHand,
	getGameState, getHandSize,
	readOwnedMosjes, unlockPiecies, setHand,
} from '../helpers.js';

async function activatePiecie(page, cardId) {
	const el = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await el.waitFor({ state: 'visible', timeout: 8000 });
	const btn = el.locator('button:has-text("Activate")');
	await btn.waitFor({ state: 'visible', timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(600);
}

test('Redbull makes Coert Extra Resources trigger TWICE — pay 20 MP, draw 2', async ({ page }) => {
	test.setTimeout(90000);

	const deck = {
		id: 'custom_redbull_coert',
		name: 'Redbull + Coert',
		mosjes: ['mosje_coert_tech'],  // ability: pay 10 MP → draw 1 (unlimited)
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Plenty of MP so two 10-MP activations both succeed.
	await setMosjeMP(page, 'player_1', 0, 50);
	await setHand(page, 'player_1', ['piecie_redbull',
		'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	// Play + activate Redbull this turn → abilityDoubleTrigger = true
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await activatePiecie(page, 'piecie_redbull');

	const afterRedbull = await getGameState(page);
	expect(afterRedbull?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	const handBefore = await getHandSize(page, 'player_1');
	const mpBefore = (await readOwnedMosjes(page))[0]?.mp;

	// Use Coert's ability — Redbull should make it fire twice.
	const coert = page.locator('.mosje-card--owned[data-card-id="mosje_coert_tech"]');
	const abilityBtn = coert.locator('.mosje-ability-btn');
	await abilityBtn.waitFor({ state: 'visible', timeout: 5000 });
	await abilityBtn.click();
	await page.waitForTimeout(800);
	await ss(page, 'redbull-coert-after-ability');

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;

	console.log(`hand ${handBefore}→${handAfter} (Δ${handAfter - handBefore}), MP ${mpBefore}→${mpAfter} (Δ${mpAfter - mpBefore})`);

	// "Triggers twice": two draws, two 10-MP payments.
	expect(handAfter - handBefore).toBe(2);
	expect(mpBefore - mpAfter).toBe(20);

	// Flag consumed afterwards.
	const stateAfter = await getGameState(page);
	expect(stateAfter?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

test('Redbull + Coert at 15 MP — second trigger fizzles, Redbull stays armed', async ({ page }) => {
	test.setTimeout(90000);

	const deck = {
		id: 'custom_redbull_coert_lowmp',
		name: 'Redbull + Coert (low MP)',
		mosjes: ['mosje_coert_tech'],
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'],
		places: [],
		quests: [],
	};
	await seedCustomDeck(page, deck, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull',
		'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await activatePiecie(page, 'piecie_redbull');

	// Only 15 MP: enough for ONE 10-MP activation, not two.
	await setMosjeMP(page, 'player_1', 0, 15);
	await page.waitForTimeout(200);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	const handBefore = await getHandSize(page, 'player_1');

	const coert = page.locator('.mosje-card--owned[data-card-id="mosje_coert_tech"]');
	const abilityBtn = coert.locator('.mosje-ability-btn');
	await abilityBtn.waitFor({ state: 'visible', timeout: 5000 });
	await abilityBtn.click();
	await page.waitForTimeout(800);

	const handAfter = await getHandSize(page, 'player_1');
	const mpAfter = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`hand ${handBefore}→${handAfter} (Δ${handAfter - handBefore}), MP 15→${mpAfter}`);

	// Paid once, drew once; second trigger couldn't afford the 10 MP.
	expect(handAfter - handBefore).toBe(1);
	expect(mpAfter).toBe(5);

	// Redbull stays armed (not silently wasted) so it can be cashed in later this turn.
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);
});
