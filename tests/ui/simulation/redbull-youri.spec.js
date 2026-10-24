/**
 * redbull-youri.spec.js - Redbull and Youri, The Speedrunner (Card List 2.0).
 *
 * Speed Activate: once per turn, pay 1 Energy, a Piecie placed this turn may be activated now (its cost is still
 * paid when you activate it), then draw 1 card. Redbull gives one more use: pay the 1 Energy again, activate a second Piecie, draw again. A third
 * use is refused. (The V4 uses-per-game counter and 20 MP payment no longer exist.)
 *
 * Run: npx playwright test tests/ui/simulation/redbull-youri.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, playCardFromHand, getGameState,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi, abilityChipOf } from '../../helpers/redbullUi.js';
import { activateFirstReady } from '../../helpers/boardTaps.js';
import { PIECIES } from '../../../src/data/piecies.js';

const KANNETJE_COST = PIECIES.find(p => p.id === 'piecie_kannetje_melk').cost;
const DECK = {
	id: 'custom_rb_youri', name: 'Redbull + Youri',
	mosjes: ['mosje_youri'],
	piecies: ['piecie_redbull', 'piecie_redbull', ...Array(24).fill('piecie_kannetje_melk')],
	snellePiecies: ['snelle_jensen'], places: [], quests: [],
};

async function start(page) {
	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await playAndActivateRedbull(page, { energy: 12 });
	expect(await extraUses(page)).toBe(1);
	// Lay two Piecies face-down this turn: Youri's targets (one per use).
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
}

test('Redbull re-fires Youri: 1 Energy + the Piecie cost twice, two Piecies activated, a card drawn each time', async ({ page }) => {
	test.setTimeout(90000);
	await start(page);
	const energy0 = await energyOf(page);
	const gy0 = (await getGameState(page)).players.player_1.graveyard.length;

	for (let use = 0; use < 2; use++) {
		await useAbilityViaUi(page, 'mosje_youri');   // makes a Piecie placed this turn ready (first free slot picked)
		await page.waitForTimeout(700);
		// ...and the player activates it from its tray (the first Kannetje whose Activate chip is enabled), paying its cost
		expect(await activateFirstReady(page, 'piecie_kannetje_melk'), 'a Piecie is ready after Speed Activate').toBe(true);
		await page.waitForTimeout(700);
	}
	await ss(page, 'redbull-youri-twice');

	const st = await getGameState(page);
	expect(st.players.player_1.graveyard.length).toBe(gy0 + 2);               // both Piecies were activated and discarded
	expect(await energyOf(page)).toBe(energy0 - 2 * (1 + KANNETJE_COST));      // Speed Activate (1) + the Piecie cost, twice
	expect(st.players.player_1.activeSlots[0].abilityUsesThisTurn).toBe(2);
});

test('Redbull + Youri: a third Speed Activate is refused and costs nothing', async ({ page }) => {
	test.setTimeout(90000);
	await start(page);
	await useAbilityViaUi(page, 'mosje_youri');
	await page.waitForTimeout(600);
	await useAbilityViaUi(page, 'mosje_youri');
	await page.waitForTimeout(600);
	const energy = await energyOf(page);
	const chip = await abilityChipOf(page, 'mosje_youri');
	expect(chip.present && chip.disabled, 'the Ability chip is disabled').toBe(true);
	expect(await energyOf(page)).toBe(energy);
	expect((await getGameState(page)).players.player_1.activeSlots[0].abilityUsesThisTurn).toBe(2);
});
