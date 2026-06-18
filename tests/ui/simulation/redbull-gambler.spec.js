/**
 * redbull-gambler.spec.js — Redbull doubles Jeffrey Gambler's High Stakes.
 *
 * Group A, simplest case: High Stakes is self-contained (fixed 30 MP bet + fresh
 * d6, no stale _pendingTargets), so a plain re-run bets again and rolls again — a
 * true "triggers twice". Just needs removing from NO_DOUBLE_ABILITIES (like Coert).
 *
 * Dice mocked to always roll 6 (win): each fire = -30 bet +60 = net +30.
 * Single = +30, doubled = +60.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-gambler.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, readOwnedMosjes, mockDiceRoll,
} from '../helpers.js';

test('Redbull doubles Jeffrey Gambler — two bets, two rolls (+60 net)', async ({ page }) => {
	test.setTimeout(90000);

	await mockDiceRoll(page, 0.9); // Math.random→0.9 ⇒ d6 always rolls 6 (win)

	await seedCustomDeck(page, {
		id: 'custom_rb_gambler', name: 'Redbull + Gambler',
		mosjes: ['mosje_jeffrey_gambler'],   // High Stakes: bet 30, d6 4+ → net +30
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	// Arm Redbull
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	// 35 MP (on the 5-grid): bet 30 twice under always-win → 35→5→65→35→95.
	await setMosjeMP(page, 'player_1', 0, 35);
	await page.waitForTimeout(200);
	const before = (await readOwnedMosjes(page))[0]?.mp;

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'redbull-gambler');

	const after = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Gambler MP ${before}→${after} (net ${after - before}; single +30, doubled +60)`);

	expect(after - before).toBe(60);  // fired twice
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

test('Redbull doubles Jeffrey Gambler — both bets LOST (-60 net)', async ({ page }) => {
	test.setTimeout(90000);

	await mockDiceRoll(page, 0.1); // Math.random→0.1 ⇒ d6 always rolls 1 (loss, <4)

	await seedCustomDeck(page, {
		id: 'custom_rb_gambler_lose', name: 'Redbull + Gambler (lose)',
		mosjes: ['mosje_jeffrey_gambler'],
		piecies: ['piecie_redbull', 'piecie_redbull',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk',
		          'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	// Arm Redbull
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	// 70 MP: enough to bet 30 twice (70→40→10), both bets lost (no +60 on a roll <4).
	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	const before = (await readOwnedMosjes(page))[0]?.mp;

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'redbull-gambler-lose');

	const after = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`Gambler MP ${before}→${after} (net ${after - before}; single -30, doubled -60)`);

	expect(after - before).toBe(-60);  // both bets lost — fired twice
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});
