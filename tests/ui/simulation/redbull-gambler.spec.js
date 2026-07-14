/**
 * redbull-gambler.spec.js — Redbull doubles Jeffrey Gambler's High Stakes.
 *
 * 2026-07-13 ability-text-engine-reconciliation ruling: the old fixed-30-MP wager
 * mechanic was dropped entirely ("too OP"). NEW DESIGN: roll 1d6, no MP cost, no MP
 * change either way. Rolls 1-5 → QUEST_BLOCKED this turn. Roll 6 → +3 Quest roll
 * bonus (questPrepBonus). High Stakes is still self-contained (fresh d6, no stale
 * _pendingTargets), so a plain re-run rolls again — a true "triggers twice".
 *
 * Dice mocked to a fixed value so both the original cast and the Redbull echo land
 * on the same outcome.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-gambler.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, readOwnedMosjes, mockDiceRoll,
} from '../helpers.js';

test('Redbull doubles Jeffrey Gambler — jackpot twice (+6 Quest roll bonus, no MP change)', async ({ page }) => {
	test.setTimeout(90000);

	await mockDiceRoll(page, 0.9); // Math.random→0.9 ⇒ d6 always rolls 6 (jackpot)

	await seedCustomDeck(page, {
		id: 'custom_rb_gambler', name: 'Redbull + Gambler',
		mosjes: ['mosje_jeffrey_gambler'],   // High Stakes: roll 1d6, 6 → +3 questPrepBonus
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

	await setMosjeMP(page, 'player_1', 0, 35);
	await page.waitForTimeout(200);
	const before = (await readOwnedMosjes(page))[0]?.mp;

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'redbull-gambler');

	const after = (await readOwnedMosjes(page))[0]?.mp;
	const state = await getGameState(page);
	console.log(`Gambler MP ${before}→${after} (should be unchanged); questPrepBonus=${state?.players?.player_1?.questPrepBonus}`);

	expect(after - before).toBe(0);  // High Stakes never touches MP
	expect(state?.players?.player_1?.questPrepBonus).toBe(6);  // two jackpot rolls: +3 +3
	expect(state?.players?.player_1?.activeSlots?.[0]?.statusEffects ?? []).toEqual([]);
	expect(state?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

test('Redbull doubles Jeffrey Gambler — QUEST_BLOCKED twice, no MP change', async ({ page }) => {
	test.setTimeout(90000);

	await mockDiceRoll(page, 0.1); // Math.random→0.1 ⇒ d6 always rolls 1 (QUEST_BLOCKED)

	await seedCustomDeck(page, {
		id: 'custom_rb_gambler_lose', name: 'Redbull + Gambler (blocked)',
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

	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	const before = (await readOwnedMosjes(page))[0]?.mp;

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'redbull-gambler-lose');

	const after = (await readOwnedMosjes(page))[0]?.mp;
	const state = await getGameState(page);
	const questBlockedCount = (state?.players?.player_1?.activeSlots?.[0]?.statusEffects ?? [])
		.filter(e => e.type === 'QUEST_BLOCKED').length;
	console.log(`Gambler MP ${before}→${after} (should be unchanged); QUEST_BLOCKED count=${questBlockedCount}`);

	expect(after - before).toBe(0);  // High Stakes never touches MP
	expect(questBlockedCount).toBe(2);  // both fires pushed QUEST_BLOCKED
	expect(state?.players?.player_1?.questPrepBonus ?? 0).toBe(0);
	expect(state?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});
