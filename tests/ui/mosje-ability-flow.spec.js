// mosje-ability-flow.spec.js — 58-03: the data-driven ability button + input flow (headless).
// Tuk Healer (activated, 1 Energy, input own_slot_index) heals through the one generic flow; trigger Mosjes
// have no button; the button is disabled without Energy.
// 63-06: "the button" is the Ability chip in the Mosje's action tray (tap the Mosje); the tile carries no button.
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, setEnergy, setPendingTargets, getGameState } from './helpers.js';
import { abilityByTap, readTrayChip } from '../helpers/boardTaps.js';

async function boot(page) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
}
const cardOf = (page, name) => page.locator('.mosje-card--owned', { hasText: name }).first();

test.describe('Mosje ability flow (58-03)', () => {
	test('Tuk Healer: preset input is not asked again; MP and Energy change on screen state', async ({ page }) => {
		await boot(page);
		await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 20, level: 1 });
		await setMosjeOnField(page, 'player_1', 1, 'mosje_gandoe_wizard', { mp: 20, level: 1 });
		await setEnergy(page, 'player_1', 3);
		await setPendingTargets(page, { own_slot_index: 1 });
		const before = await getGameState(page);
		const chip = await readTrayChip(page, 'mosje', 'mosje_tuk_healer', 'ability');
		expect(chip.present, 'Tuk shows an Ability chip in her tray').toBe(true);
		expect(chip.disabled, 'the Ability chip is enabled').toBe(false);
		await abilityByTap(page, 'mosje_tuk_healer');
		await expect.poll(async () => (await getGameState(page)).players.player_1.energy).toBe(2);
		const after = await getGameState(page);
		// Card List 2.0: Healing Hands gives exactly +20 to the chosen Mosje, the healer herself gains nothing.
		expect(after.players.player_1.activeSlots[1].mp).toBe(before.players.player_1.activeSlots[1].mp + 20);
		expect(after.players.player_1.activeSlots[0].mp).toBe(before.players.player_1.activeSlots[0].mp);
		await expect(page.locator('.modal-root--open')).toHaveCount(0); // no prompt was shown
		const used = await readTrayChip(page, 'mosje', 'mosje_tuk_healer', 'ability');
		expect(used.disabled, 'the Ability chip is disabled: used this turn').toBe(true);
		expect(used.reason).toBe('Ability already used this turn');
	});

	test('Trigger Mosje (Gandoe Wizard) shows no Ability chip', async ({ page }) => {
		await boot(page);
		await setMosjeOnField(page, 'player_1', 0, 'mosje_gandoe_wizard', { mp: 20, level: 1 });
		await expect(cardOf(page, 'Wizard')).toBeVisible();
		expect((await readTrayChip(page, 'mosje', 'mosje_gandoe_wizard', 'ability')).present).toBe(false);
	});

	test('Ability chip is disabled with 0 Energy', async ({ page }) => {
		await boot(page);
		await setMosjeOnField(page, 'player_1', 0, 'mosje_tuk_healer', { mp: 20, level: 1 });
		await setEnergy(page, 'player_1', 0);
		const chip = await readTrayChip(page, 'mosje', 'mosje_tuk_healer', 'ability');
		expect(chip.present).toBe(true);
		expect(chip.disabled).toBe(true);
		expect(chip.reason).toMatch(/Not enough Energy/);
	});
});
