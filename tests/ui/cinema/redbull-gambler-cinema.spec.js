/**
 * redbull-gambler-cinema.spec.js — slow, narrated walkthrough of Jeffrey Gambler's
 * High Stakes, and how Redbull doubling it stacks a second roll.
 *
 * 2026-07-13 ability-text-engine-reconciliation ruling dropped the old fixed-30-MP
 * wager entirely ("too OP"). NEW DESIGN: roll 1d6, no MP cost, no MP change ever.
 * Rolls 1-5 → QUEST_BLOCKED this turn. Roll 6 → +3 Quest roll bonus. Scene 1 shows
 * ONE forced-1 roll (QUEST_BLOCKED, MP untouched); Scene 2 shows Redbull firing it
 * TWICE — two QUEST_BLOCKED entries stack, MP still untouched.
 *
 * Watch: npx playwright test --project=visual --headed tests/ui/cinema/redbull-gambler-cinema.spec.js --workers=1
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand,
	getGameState, readOwnedMosjes, mockDiceRoll,
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
const questBlockedCount = async (page) => {
	const state = await getGameState(page);
	return (state?.players?.player_1?.activeSlots?.[0]?.statusEffects ?? [])
		.filter(e => e.type === 'QUEST_BLOCKED').length;
};

test('🎬 High Stakes rolled ONCE — QUEST_BLOCKED, MP untouched (70 → 70)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.1);  // d6 → 1

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	await ss(page, 'gambler-1-start');
	await beat(`Scene 1 — Jeffrey starts at ${await jefMp(page)} MP. No Redbull.`);
	await beat('High Stakes: no cost, no wager anymore — rolls 1d6 and gets a 1 → QUEST_BLOCKED this turn.');

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'gambler-1-after');
	const after = await jefMp(page);
	const blocked = await questBlockedCount(page);
	console.log(`🎬 RESULT — Jeffrey stays at ${after} MP; QUEST_BLOCKED count=${blocked}`);
	await beat(`No MP lost: still ${after}. But QUEST_BLOCKED means no Quest attempts this turn.`);
	expect(after).toBe(70);
	expect(blocked).toBe(1);
});

test('🎬 Redbull doubles the roll — two QUEST_BLOCKED entries stack, MP still untouched (70 → 70)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.1);  // d6 → 1, both rolls land the same

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);

	// Arm Redbull
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(500);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(600);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);

	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	await ss(page, 'gambler-2-armed');
	await beat(`Scene 2 — Jeffrey at ${await jefMp(page)} MP, ⚡ Redbull ACTIVE — High Stakes will fire TWICE.`);
	await beat('Dice forced to 1 again → both rolls push QUEST_BLOCKED. Still zero MP cost, either roll.');

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(1000);
	await ss(page, 'gambler-2-after');
	const after = await jefMp(page);
	const blocked = await questBlockedCount(page);
	console.log(`🎬 RESULT — Jeffrey stays at ${after} MP; QUEST_BLOCKED count=${blocked} (fired twice)`);
	await beat(`MP untouched at ${after} — the redesign has nothing left for Redbull to double INTO danger. 🎬 fin`);
	expect(after).toBe(70);
	expect(blocked).toBe(2);
});
