/**
 * redbull-once-per-turn.spec.js — Redbull (Card List 2.0): "One of your Mosjes may use its once-per-turn ability one
 * more time this turn (pay its cost again)."
 *
 * Tuk Healer (Healing Hands, 1 Energy: one Mosje of yours gains 20 MP) is the canary: the ability can be used twice
 * after Redbull, each use paying its 1 Energy, and a third use is refused. Without Redbull it stays once per turn.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-once-per-turn.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, readOwnedMosjes,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi, abilityChipOf } from '../../helpers/redbullUi.js';

const DECK = {
	id: 'custom_rb_tuk_healer', name: 'Redbull + Tuk Healer',
	mosjes: ['mosje_tuk_healer'],
	piecies: ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')],
	snellePiecies: ['snelle_jensen'], places: [], quests: [],
};

async function start(page) {
	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
}

test('Redbull gives Tuk Healer a second paid use: +20 MP twice, 1 Energy each, a third use is refused', async ({ page }) => {
	test.setTimeout(90000);
	await start(page);
	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);

	await setMosjeMP(page, 'player_1', 0, 10);
	await page.waitForTimeout(200);
	const energy0 = await energyOf(page);

	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(500);
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(30);
	expect(await energyOf(page)).toBe(energy0 - 1);

	// Second use: the button is usable again and charges the 1 Energy again.
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(500);
	await ss(page, 'redbull-tuk-healer');
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(50);
	expect(await energyOf(page)).toBe(energy0 - 2);

	// Third use: refused (the Ability chip in the tray is disabled), nothing is paid.
	const third = await abilityChipOf(page, 'mosje_tuk_healer');
	expect(third.present && third.disabled, 'the Ability chip is disabled').toBe(true);
	expect(await energyOf(page)).toBe(energy0 - 2);
});

test('Without Redbull Tuk Healer stays once per turn: one +20, then the button is disabled', async ({ page }) => {
	test.setTimeout(90000);
	await start(page);
	await setMosjeMP(page, 'player_1', 0, 10);
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(500);
	expect((await readOwnedMosjes(page))[0]?.mp).toBe(30);
	const used = await abilityChipOf(page, 'mosje_tuk_healer');
	expect(used.present && used.disabled, 'the Ability chip is disabled').toBe(true);
});
