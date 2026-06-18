/**
 * redbull-gambler-cinema.spec.js — slow, narrated walkthrough of Jeffrey Gambler's
 * High Stakes losing, and how Redbull doubling it lands on 10 MP (not "−60 = defeat").
 *
 * High Stakes: bet 30 MP, roll d6 — 4+ wins (+60), <4 loses the 30. Dice forced to 1
 * (a loss). Scene 1 shows ONE lost bet (70→40); Scene 2 shows Redbull firing it TWICE
 * (70→40→10). "−60" is the change; 10 is what's left of the starting 70.
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

test('🎬 High Stakes lost ONCE — 70 → 40 (−30)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.1);  // d6 → 1, a guaranteed loss

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', ['piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await setMosjeMP(page, 'player_1', 0, 70);
	await page.waitForTimeout(200);
	await ss(page, 'gambler-1-start');
	await beat(`Scene 1 — Jeffrey starts at ${await jefMp(page)} MP. No Redbull.`);
	await beat('High Stakes: he bets 30 MP and rolls a 1 (a loss) → he just loses the 30.');

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(900);
	await ss(page, 'gambler-1-after');
	const after = await jefMp(page);
	console.log(`🎬 RESULT — Jeffrey 70 → ${after} (one lost bet: −30)`);
	await beat(`One lost bet: 70 − 30 = ${after} MP.`);
	expect(after).toBe(40);
});

test('🎬 Redbull doubles the loss — 70 → 40 → 10 (−60), still alive', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await mockDiceRoll(page, 0.1);  // d6 → 1, both bets lose

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
	await beat('Dice forced to 1 again → both bets lose. Bet 1: 70 − 30 = 40. Bet 2: 40 − 30 = 10.');

	await page.locator('.mosje-card--owned[data-card-id="mosje_jeffrey_gambler"] .mosje-ability-btn').click();
	await page.waitForTimeout(1000);
	await ss(page, 'gambler-2-after');
	const after = await jefMp(page);
	console.log(`🎬 RESULT — Jeffrey 70 → ${after} (two lost bets: net −60)`);
	await beat(`Net −60, but he started at 70 → ends at ${after} MP. Still alive (−60 is the change, not the total). 🎬 fin`);
	expect(after).toBe(10);
});
