/**
 * redbull-gambler.spec.js — Redbull and Jeffrey, The Silent Gambler (Card List 2.0).
 *
 * High Stakes: once per turn, stake 1 or 2 Energy and roll a die. 1-2: the Energy is lost. 3-4: you get it back.
 * 5-6: you get it back, draw 1 card, gain 10 MP per Energy staked, and the next Quest success this turn gives +15 MP.
 * Redbull gives one more use (the stake is staked again), so the roll happens twice. Dice are mocked to a fixed value.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-gambler.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, getGameState, getHandSize, readOwnedMosjes, mockDiceRoll,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi } from '../../helpers/redbullUi.js';

async function start(page, id) {
	await seedCustomDeck(page, {
		id, name: 'Redbull + Gambler', mosjes: ['mosje_jeffrey_gambler'],
		piecies: ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
}

test('Redbull doubles Jeffrey Gambler: jackpot twice (+10 MP and a card each, stakes come back)', async ({ page }) => {
	test.setTimeout(90000);
	await mockDiceRoll(page, 0.9); // d6 always rolls 6
	await start(page, 'custom_rb_gambler');
	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);

	await setMosjeMP(page, 'player_1', 0, 35);
	await page.waitForTimeout(200);
	const energy0 = await energyOf(page);
	const hand0 = await getHandSize(page, 'player_1');

	await useAbilityViaUi(page, 'mosje_jeffrey_gambler');
	await page.waitForTimeout(500);
	await useAbilityViaUi(page, 'mosje_jeffrey_gambler');
	await page.waitForTimeout(500);
	await ss(page, 'redbull-gambler-jackpot');

	expect((await readOwnedMosjes(page))[0]?.mp).toBe(55);          // +10 per staked Energy, twice (stake 1)
	expect(await getHandSize(page, 'player_1')).toBe(hand0 + 2);    // a card each time
	expect(await energyOf(page)).toBe(energy0);                     // the stakes came back
	expect((await getGameState(page)).players.player_1.gamblerQuestBonusTurn).toBeDefined();
});

test('Redbull doubles Jeffrey Gambler: two losing rolls lose the stake twice, MP untouched', async ({ page }) => {
	test.setTimeout(90000);
	await mockDiceRoll(page, 0.1); // d6 always rolls 1
	await start(page, 'custom_rb_gambler_lose');
	await playAndActivateRedbull(page);

	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	const energy0 = await energyOf(page);

	await useAbilityViaUi(page, 'mosje_jeffrey_gambler');
	await page.waitForTimeout(500);
	await useAbilityViaUi(page, 'mosje_jeffrey_gambler');
	await page.waitForTimeout(500);
	await ss(page, 'redbull-gambler-lost');

	expect((await readOwnedMosjes(page))[0]?.mp).toBe(70);
	expect(await energyOf(page)).toBe(energy0 - 2);                 // 1 Energy lost per losing roll
	expect((await getGameState(page)).players.player_1.gamblerQuestBonusTurn).toBeUndefined();
});
