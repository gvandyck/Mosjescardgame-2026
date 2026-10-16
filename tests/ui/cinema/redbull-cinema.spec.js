/**
 * redbull-cinema.spec.js - "Cinema mode" demo of Redbull (Card List 2.0): one Mosje may use its once-per-turn ability
 * one more time this turn, paying its Energy again.
 *
 * A deliberately SLOW, narrated walkthrough: board -> Redbull placed and activated -> Tuk Healer's Healing Hands is
 * used twice (+20 MP each, 1 Energy each). It still asserts the real outcome, so it doubles as a regression check.
 * Runs in the `visual` project (headed + slowMo). Watch it:
 *   npx playwright test --project=visual tests/ui/cinema/redbull-cinema.spec.js --headed
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, getGameState,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi } from '../../helpers/redbullUi.js';

const tukMp = async (page) => (await getGameState(page))?.players?.player_1?.activeSlots?.[0]?.mp ?? null;

test('🎬 Redbull cinema - the ability can be used a second time, paying its Energy again', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2200 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	await seedCustomDeck(page, {
		id: 'custom_cinema_redbull', name: 'Redbull Cinema',  // id MUST start with custom_ (resolveCustomDeckDef)
		mosjes: ['mosje_tuk_healer'],            // Healing Hands: 1 Energy, one of your Mosjes gains 20 MP
		piecies: ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')],
		snellePiecies: ['snelle_jensen'], places: [], quests: [],
	}, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 - Tuk is on the field (Healing Hands: 1 Energy, +20 MP, once per turn)');

	await setMosjeMP(page, 'player_1', 0, 10);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await ss(page, 'cinema-redbull-1-start');
	await beat('Tuk at 10 MP, holding Redbull');

	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);
	await ss(page, 'cinema-redbull-2-active');
	await beat('Redbull ACTIVE - Healing Hands may be used one more time');

	const energy0 = await energyOf(page);
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(700);
	await beat(`First use: Tuk at ${await tukMp(page)} MP`);
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(700);
	await ss(page, 'cinema-redbull-3-fired');
	const after = await tukMp(page);
	await beat(`Second use: Tuk at ${after} MP, Energy ${energy0} -> ${await energyOf(page)}. fin`);

	expect(after).toBe(50);
	expect(await energyOf(page)).toBe(energy0 - 2);
});
