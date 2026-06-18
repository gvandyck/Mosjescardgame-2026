/**
 * redbull-youri.spec.js — Redbull re-fires Youri's Speed Activate, within the cap.
 *
 * Ruling (user, 2026-06-17): Youri follows the existing pay/activate-twice flow
 * (pay 20 + pick a face-down Piecie each time), BUT the 3-uses-per-game cap is
 * respected — if firing twice would exceed the cap, the second trigger is denied.
 *
 * Youri is in REPROMPT_DOUBLE_ABILITIES; the cap is enforced inside the ability fn,
 * so the second cast simply fails when no uses remain.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-youri.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, unlockPiecies, playCardFromHand, getGameState,
} from '../helpers.js';

async function armRedbull(page) {
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await page.locator('#piecies-player [data-card-id="piecie_redbull"]').first()
		.locator('button:has-text("Activate")').click();
	await page.waitForTimeout(500);
	expect((await getGameState(page))?.players?.player_1?.abilityDoubleTrigger).toBe(true);
}

async function setYouriUses(page, count) {
	await page.evaluate((c) => window.__testHooks?.setYouriUses('player_1', c), count);
}

const DECK = {
	id: 'custom_rb_youri', name: 'Redbull + Youri',
	mosjes: ['mosje_youri'],
	piecies: ['piecie_redbull', 'piecie_redbull', ...Array(24).fill('piecie_kannetje_melk')],
	snellePiecies: ['snelle_jensen'], places: [], quests: [],
};

test('Redbull re-fires Youri — pay 20 + activate a Piecie TWICE (uses 0→2)', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Hand: Redbull + 2 Piecies to lay face-down as Youri targets.
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await armRedbull(page);

	// Lay two face-down Piecies for Youri to activate (one per fire).
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);

	await setYouriUses(page, 0);
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.waitForTimeout(200);

	// Fire Youri. First cast (2 face-down) prompts a slot pick; second cast (1 left)
	// auto-activates the remaining face-down Piecie.
	await page.locator('.mosje-card--owned[data-card-id="mosje_youri"] .mosje-ability-btn').click();
	const slotBtn = page.locator('.modal-mosje-select-btn');
	await slotBtn.first().waitFor({ state: 'visible', timeout: 15000 });
	await slotBtn.first().click();
	await page.waitForTimeout(1500);
	await ss(page, 'redbull-youri-twice');

	const st = await getGameState(page);
	console.log('youriAbilityUses:', st?.players?.player_1?.youriAbilityUses);
	expect(st?.players?.player_1?.youriAbilityUses).toBe(2);     // fired twice
	expect(st?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});

test('Redbull + Youri at 2 uses — first fire is the 3rd use, second is DENIED (cap)', async ({ page }) => {
	test.setTimeout(90000);

	await seedCustomDeck(page, DECK, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
	await armRedbull(page);

	// One face-down Piecie — first fire auto-activates it.
	await playCardFromHand(page, 'piecie_kannetje_melk');
	await page.waitForTimeout(300);

	await setYouriUses(page, 2);   // already used twice this game → only 1 use left
	await setMosjeMP(page, 'player_1', 0, 60);
	await page.waitForTimeout(200);

	await page.locator('.mosje-card--owned[data-card-id="mosje_youri"] .mosje-ability-btn').click();
	await page.waitForTimeout(1200);
	// The denied second cast surfaces a "Cannot Use Ability" modal — dismiss if present.
	const dismiss = page.locator('#modal-continue, .modal-btn');
	if (await dismiss.first().isVisible({ timeout: 2000 }).catch(() => false)) {
		await dismiss.first().click();
	}
	await ss(page, 'redbull-youri-cap');

	const st = await getGameState(page);
	console.log('youriAbilityUses (cap):', st?.players?.player_1?.youriAbilityUses);
	expect(st?.players?.player_1?.youriAbilityUses).toBe(3);     // 3rd use only — NOT 4
	expect(st?.players?.player_1?.abilityDoubleTrigger).toBeFalsy();
});
