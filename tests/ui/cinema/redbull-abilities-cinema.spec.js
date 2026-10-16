/**
 * redbull-abilities-cinema.spec.js - "Cinema mode" demos of Redbull (Card List 2.0) across different Mosje abilities.
 *
 * Deliberately SLOW, narrated walkthroughs so a human can watch Redbull give a second paid use (or correctly NOT apply):
 *
 *   1. Redbull + Tuk Healer (simple ability)       -> used twice, 1 Energy each
 *   2. Redbull + Coert alone (draw-step ability)   -> no target: Energy spent, nothing granted
 *   3. Redbull + Binti (discard + target ability)  -> Cutting Words twice: -20 MP on the opponent, 2 Energy, 2 discards
 *
 * Each scene still asserts the real outcome, so it doubles as a visual regression check.
 *
 * Watch it:
 *   npx playwright test --project=visual --headed tests/ui/cinema/redbull-abilities-cinema.spec.js
 *   (tune pace with CINEMA=<ms>, e.g. CINEMA=2500)
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, getGameState, readOwnedMosjes,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf, useAbilityViaUi } from '../../helpers/redbullUi.js';

function makeBeat(page, testInfo) {
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2000 : 0);
	return (label) => { if (label) console.log(`CINEMA ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };
}
const PIECIES = ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')];
const deck = (id, mosjes) => ({ id, name: id, mosjes, piecies: PIECIES, snellePiecies: ['snelle_jensen'], places: [], quests: [] });

// ───────────────────────────────────────────────────────────────────────────
test('Redbull + Tuk Healer - the ability is used twice (+20 MP each, 1 Energy each)', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await seedCustomDeck(page, deck('custom_cinema_rb_tuk', ['mosje_tuk_healer']), 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 - Tuk on the field (Healing Hands: 1 Energy, +20 MP)');

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await setMosjeMP(page, 'player_1', 0, 10);
	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);
	await ss(page, 'cinema-rb-armed');
	await beat('Redbull ACTIVE - one more use of the ability this turn');

	const energy0 = await energyOf(page);
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(600);
	await useAbilityViaUi(page, 'mosje_tuk_healer');
	await page.waitForTimeout(600);
	await ss(page, 'cinema-rb-tuk-fired');
	const mp = (await readOwnedMosjes(page))[0]?.mp;
	console.log(`RESULT - Tuk ${mp} MP, Energy ${energy0} -> ${await energyOf(page)}`);
	await beat(`TWICE - Tuk at ${mp} MP`);
	expect(mp).toBe(50);
	expect(await energyOf(page)).toBe(energy0 - 2);
	await beat('Redbull is used up. fin');
});

// ───────────────────────────────────────────────────────────────────────────
test('Redbull + Coert alone - draw-step ability, no target: the Energy is spent, nothing is granted', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await seedCustomDeck(page, deck('custom_cinema_rb_coert', ['mosje_coert_tech']), 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	const draw = page.getByRole('button', { name: 'Draw normally' });
	if (await draw.isVisible({ timeout: 1500 }).catch(() => false)) { await draw.click(); await page.waitForTimeout(400); }
	await beat('Scene 2 - Coert on the field (Extra Resources is used in the draw step, there is no button)');

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await playAndActivateRedbull(page, { energy: 8 });
	await ss(page, 'cinema-rb-coert');
	expect(await extraUses(page)).toBe(0);
	expect(await energyOf(page)).toBeLessThan(8);
	await beat('No Mosje with a usable ability: Redbull fizzles. fin');
});

// ───────────────────────────────────────────────────────────────────────────
test('Redbull + Binti - Cutting Words twice: the opponent loses 20 MP, 2 Energy', async ({ page }, testInfo) => {
	test.setTimeout(120000);
	const beat = makeBeat(page, testInfo);
	await seedCustomDeck(page, deck('custom_cinema_rb_binti', ['mosje_binti']), 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 3 - Binti on the field (Cutting Words: discard a Piecie, one opponent Mosje loses 10 MP)');

	const oppSlot = (await getGameState(page)).players.player_2.activeSlots.findIndex(s => s && !s.isDefeated);
	await page.evaluate(() => window.__testHooks.clearEntryProtection());
	await setMosjeMP(page, 'player_2', oppSlot, 60);
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await playAndActivateRedbull(page);
	expect(await extraUses(page)).toBe(1);

	const oppBefore = (await getGameState(page)).players.player_2.activeSlots[oppSlot].mp;
	const energy0 = await energyOf(page);
	await useAbilityViaUi(page, 'mosje_binti');
	await page.waitForTimeout(600);
	await useAbilityViaUi(page, 'mosje_binti');
	await page.waitForTimeout(600);
	await ss(page, 'cinema-rb-binti-fired');

	const oppAfter = (await getGameState(page)).players.player_2.activeSlots[oppSlot].mp;
	console.log(`RESULT - opponent ${oppBefore} -> ${oppAfter}, Energy ${energy0} -> ${await energyOf(page)}`);
	await beat(`Opponent lost ${oppBefore - oppAfter} MP in two uses`);
	expect(oppBefore - oppAfter).toBe(20);
	expect(await energyOf(page)).toBe(energy0 - 2);
	await beat('fin');
});
