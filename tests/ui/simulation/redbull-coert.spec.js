/**
 * redbull-coert.spec.js — Redbull and Coert, The Hawaiian Tech Savant (Card List 2.0).
 *
 * Coert's Extra Resources is a draw-step ability (pay 1 Energy to draw 1 extra card, up to 2 times per turn): it
 * has no Activate button to press again, so Redbull never targets it. The V4 story (Redbull echoes a 10-MP
 * "pay and draw" ability) is gone: MP is never spent on abilities in 2.0.
 *
 * Run: npx playwright test tests/ui/simulation/redbull-coert.spec.js
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedCustomDeck, waitForBoard, ss, setHand, getGameState, setMosjeOnField,
} from '../helpers.js';
import { playAndActivateRedbull, extraUses, energyOf } from '../../helpers/redbullUi.js';

const piecies = ['piecie_redbull', 'piecie_redbull', ...Array(6).fill('piecie_kannetje_melk')];

async function start(page, mosjes) {
	await seedCustomDeck(page, { id: 'custom_redbull_coert', name: 'Redbull + Coert', mosjes, piecies, snellePiecies: ['snelle_jensen'], places: [], quests: [] }, 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.waitForTimeout(600);
	const draw = page.getByRole('button', { name: 'Draw normally' }); // Coert's draw-step prompt: no extra draw
	if (await draw.isVisible({ timeout: 1500 }).catch(() => false)) { await draw.click(); await page.waitForTimeout(400); }
	for (let i = 0; i < mosjes.length; i++) await setMosjeOnField(page, 'player_1', i, mosjes[i], { mp: 30, level: 1 });
	await setHand(page, 'player_1', ['piecie_redbull', 'piecie_kannetje_melk']);
	await page.waitForTimeout(200);
}

test('Redbull next to Coert goes to the Mosje with an Activate button (Coert is not offered)', async ({ page }) => {
	test.setTimeout(90000);
	await start(page, ['mosje_coert_tech', 'mosje_tuk_healer']);
	const slots = (await getGameState(page)).players.player_1.activeSlots;
	const tuk = slots.findIndex(s => s?.cardId === 'mosje_tuk_healer');
	const coert = slots.findIndex(s => s?.cardId === 'mosje_coert_tech');
	expect(tuk).toBeGreaterThanOrEqual(0);
	expect(coert).toBeGreaterThanOrEqual(0);

	await playAndActivateRedbull(page);
	await ss(page, 'redbull-coert-tuk');
	expect(await extraUses(page, tuk)).toBe(1);
	expect(await extraUses(page, coert)).toBe(0);
});

test('Redbull with only Coert on the field has no target: the Energy is spent and nothing is granted', async ({ page }) => {
	test.setTimeout(90000);
	await start(page, ['mosje_coert_tech']);
	await playAndActivateRedbull(page, { energy: 8 });
	expect(await extraUses(page, 0)).toBe(0);
	expect(await energyOf(page)).toBeLessThan(8); // the Redbull Energy is spent and nothing is refunded
});
