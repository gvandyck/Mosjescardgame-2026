/**
 * redbull-gambler-cinema.spec.js — slow, narrated walkthrough of Jeffrey Gambler's
 * High Stakes, and how Redbull doubling it stacks a second roll.
 *
 * 2.0 High Stakes: stake 1 or 2 Energy, roll a die: 1-2 the Energy is lost, 3-4 you get it back, 5-6 you get it back,
 * draw 1 and gain 10 MP per Energy staked. Scene 1 shows ONE forced-1 roll (the Energy is lost, MP untouched); Scene 2
 * shows Redbull giving a second use: two forced-6 rolls, +10 MP and a card each.
 *
 * Watch: npx playwright test --project=visual --headed tests/ui/cinema/redbull-gambler-cinema.spec.js --workers=1
 */

import { test, expect } from '@playwright/test';
import { answerModals } from '../../helpers/answerModals.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi } from '../../helpers/redbullUi.js';
import { abilityByTap } from '../../helpers/boardTaps.js';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, getGameState, getHandSize, readOwnedMosjes, mockDiceRoll,
} from '../helpers.js';

function makeBeat(page, testInfo) {
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2500 : 0);
	return (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };
}
const DECK = {
	id: 'custom_cinema_gambler', name: 'Gambler Cinema',
	mosjes: ['mosje_jeffrey_gambler'],
	piecies: ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')],
	snellePiecies: ['snelle_jensen'], places: [], quests: [],
};
const jefMp = async (page) => (await readOwnedMosjes(page))[0]?.mp;

// 2.0 High Stakes: once per turn stake 1 or 2 Energy and roll a die: 1-2 the Energy is lost, 3-4 you get it back,
// 5-6 you get it back, draw 1 and gain 10 MP per Energy staked. MP is never staked. Scene 1: stake 1, roll a 1.
test('🎬 High Stakes stake 1, roll a 1 - the Energy is lost, MP untouched (70 -> 70)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.1);  // d6 -> 1

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await setMosjeMP(page, 'player_1', 0, 70);
	await page.evaluate(() => window.__testHooks.setEnergy('player_1', 4));
	await page.waitForTimeout(200);
	await ss(page, 'gambler-1-start');
	await beat(`Scene 1 - Jeffrey starts at ${await jefMp(page)} MP with 4 Energy. No Redbull.`);
	await beat('High Stakes: stake 1 Energy, the die shows a 1 -> the Energy is lost.');

	await abilityByTap(page, 'mosje_jeffrey_gambler'); // tap the Mosje, Ability in its tray
	await page.waitForTimeout(500);
	await answerModals(page, [/1/]);
	await page.waitForTimeout(900);
	await ss(page, 'gambler-1-after');
	const after = await jefMp(page);
	const energy = (await getGameState(page)).players.player_1.energy;
	console.log(`RESULT - Jeffrey stays at ${after} MP; Energy ${energy}`);
	await beat(`No MP lost: still ${after}. Energy 4 -> ${energy}.`);
	expect(after).toBe(70);
	expect(energy, 'stake of 1 lost').toBe(3);
});

// Redbull gives High Stakes one more use: stake 1 again, roll again. Both rolls are a 6 (jackpot): +10 MP and a card each.
test('🎬 Redbull doubles the roll - two jackpots, +10 MP and a card each (70 -> 90), the stakes come back', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.9);  // d6 -> 6, both rolls land the same

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);

	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	const energy0 = await energyOf(page);
	const hand0 = await getHandSize(page, 'player_1');
	await ss(page, 'gambler-2-armed');
	await beat(`Scene 2 - Jeffrey at ${await jefMp(page)} MP, Redbull ACTIVE: High Stakes can be used a second time.`);
	await beat('Dice forced to 6: both rolls are a jackpot.');

	await useAbilityViaUi(page, 'mosje_jeffrey_gambler', [/1/]);
	await page.waitForTimeout(700);
	await beat('First roll done - the Activate button is usable again.');
	await useAbilityViaUi(page, 'mosje_jeffrey_gambler', [/1/]);
	await page.waitForTimeout(700);
	await ss(page, 'gambler-2-after');
	const after = await jefMp(page);
	console.log(`RESULT - Jeffrey ${after} MP, hand +${(await getHandSize(page, 'player_1')) - hand0}`);
	await beat(`MP 70 -> ${after}. fin`);
	expect(after).toBe(90);
	expect(await getHandSize(page, 'player_1')).toBe(hand0 + 2);
	expect(await energyOf(page)).toBe(energy0);
});
