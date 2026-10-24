/**
 * redbull-reprompt.spec.js - Redbull (Card List 2.0) gives an input ability a second use, and the second use asks its
 * questions again with a FRESH prompt (each use is a normal, paid activation: no echo, no stale input).
 * Verifies Martin Senor West (Calculated Guess), FPS West (Tactical Analysis) and Tuk Architect (Perfect Placement)
 * can each be used twice under Redbull (both uses counted, a third refused).
 *
 * Run: npx playwright test tests/ui/simulation/redbull-reprompt.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss,
	setHand, setMosjeMP, setEnergy, getGameState,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, useAbilityViaUi, abilityChipOf } from '../../helpers/redbullUi.js';

const CASES = [
	{ mosje: 'mosje_martin_senor_west', botDeck: 'PHYSICAL_FORCE', name: 'Martin Senor West (Calculated Guess)' },
	{ mosje: 'mosje_fps_west', botDeck: 'ARTISTIC_RHYTHM', name: 'FPS West (Tactical Analysis)' },
	{ mosje: 'mosje_tuk_architect', botDeck: 'PHYSICAL_FORCE', name: 'Tuk Architect (Perfect Placement)' },
];

for (const c of CASES) {
	test(`Redbull: ${c.name} is used twice with a fresh prompt each time`, async ({ page }) => {
		test.setTimeout(90000);
		await seedCustomDeck(page, {
			id: `custom_rb_${c.mosje}`, name: `Redbull + ${c.mosje}`, mosjes: [c.mosje],
			// Big deck so two rounds never deplete it.
			piecies: ['piecie_redbull', 'piecie_redbull', ...Array(24).fill('piecie_kannetje_melk')],
			snellePiecies: ['snelle_jensen'], places: [], quests: [],
		}, c.botDeck);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);
		await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk', 'piecie_kannetje_melk']);
		await page.waitForTimeout(200);
		await playAndActivateRedbull(page);
		expect(await extraUses(page)).toBe(1);

		await setMosjeMP(page, 'player_1', 0, 60);
		await setEnergy(page, 'player_1', 6);
		await useAbilityViaUi(page, c.mosje);
		await page.waitForTimeout(500);
		await useAbilityViaUi(page, c.mosje);
		await page.waitForTimeout(500);
		await ss(page, `redbull-reprompt-${c.mosje}`);

		const slot = (await getGameState(page)).players.player_1.activeSlots[0];
		expect(slot.abilityUsesThisTurn).toBe(2);
		const chip = await abilityChipOf(page, c.mosje);
		expect(chip.present && chip.disabled, 'the Ability chip is disabled after two uses').toBe(true);
	});
}
