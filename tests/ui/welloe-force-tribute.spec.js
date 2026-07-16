import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	seedCustomDeck,
	waitForBoard,
	readLog,
	setMosjeOnField,
	setHand,
	unlockPiecies,
	clearEntryProtection,
	playCardFromHand,
	getGameState,
	ss,
} from './helpers.js';

// ─── Welloe Force tribute-payer picker ────────────────────────────────────────
// COST-05/06: activating Welloe Force must let the player choose which on-field
// Mosje pays the 40 MP tribute (never an automatic first-slot pick), and must be
// blocked entirely (no charge, no activation) when no on-field Mosje can afford it.

const DECK = {
	id: 'custom_welloe_force_test',
	name: 'Welloe Force Test',
	mosjes: ['mosje_michelle', 'mosje_gandoe_destroyer'],
	piecies: ['piecie_welloe_force', 'piecie_kannetje_melk', 'piecie_kannetje_melk'],
	snellePiecies: ['snelle_jensen'],
	places: [],
	quests: [],
};

async function placeAndUnlockWelloeForce(page) {
	await setHand(page, 'player_1', ['piecie_welloe_force']);
	await playCardFromHand(page, 'piecie_welloe_force');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
}

async function activateWelloeForce(page) {
	const piecieEl = page.locator('#piecies-player [data-card-id="piecie_welloe_force"]').first();
	await piecieEl.waitFor({ state: 'visible', timeout: 8000 });
	const activateBtn = piecieEl.locator('button:has-text("Activate")');
	await activateBtn.waitFor({ state: 'visible', timeout: 5000 });
	await activateBtn.click();
	await page.waitForTimeout(500);
}

test('Welloe Force — affordable payer: picker lists both Mosjes, low-MP one disabled, chosen payer loses exactly 40 MP', async ({ page }) => {
	await seedCustomDeck(page, DECK, 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Two own Mosjes: one affords the 40 MP tribute, one does not.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 80, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_gandoe_destroyer', { mp: 20, level: 1 });
	// U8 entry protection would otherwise exclude fresh opponent Mosjes from the
	// (untouched) post-hoc redirect-target picker this scenario also exercises.
	await clearEntryProtection(page);

	await placeAndUnlockWelloeForce(page);
	await activateWelloeForce(page);

	// The tribute-payer picker must be showing both Mosjes.
	const options = page.locator('.modal-mosje-select-btn');
	await expect(options).toHaveCount(2, { timeout: 5000 });

	// The low-MP (20) option must be disabled — cannot be chosen.
	const disabledOptions = page.locator('.modal-mosje-select-btn[disabled]');
	await expect(disabledOptions).toHaveCount(1);
	await ss(page, 'welloe-force-picker-affordable');

	// Choose the affordable (80 MP) payer — the enabled button.
	const enabledOption = page.locator('.modal-mosje-select-btn:not([disabled])').first();
	await enabledOption.click();
	await page.waitForTimeout(500);

	// Welloe Force's existing post-hoc redirect-target picker (untouched by this
	// plan) may open next if the opponent has more than one eligible Mosje —
	// resolve it so the activation flow completes.
	const redirectOption = page.locator('.modal-mosje-select-btn:not([disabled])').first();
	if (await redirectOption.isVisible({ timeout: 2000 }).catch(() => false)) {
		await redirectOption.click();
		await page.waitForTimeout(500);
	}

	const state = await getGameState(page);
	const payerSlot = state.players.player_1.activeSlots[0];
	expect(payerSlot.mp).toBe(40); // 80 - 40 tribute
	expect(state._welloeForceActive).toMatchObject({ ownerId: 'player_1', turnsRemaining: 3 });

	const log = await readLog(page);
	expect(log.join(' ')).toMatch(/[Ww]elloe/);
});

test('Welloe Force — unaffordable: activation blocked entirely, no picker, no MP charged', async ({ page }) => {
	await seedCustomDeck(page, DECK, 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Single own Mosje with MP below the 40 MP tribute requirement.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 20, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, null);

	await placeAndUnlockWelloeForce(page);
	await activateWelloeForce(page);

	// The picker must never open.
	await expect(page.locator('.modal-mosje-select-btn')).toHaveCount(0);

	// A "Cannot Activate" info dialog must appear instead.
	const modalTitle = page.locator('.modal-card h3');
	await expect(modalTitle).toContainText(/Cannot Activate/i, { timeout: 5000 });
	await ss(page, 'welloe-force-blocked');

	await page.locator('#modal-ok').click();
	await page.waitForTimeout(300);

	const state = await getGameState(page);
	expect(state.players.player_1.activeSlots[0].mp).toBe(20); // unchanged
	expect(state._welloeForceActive).toBeUndefined();

	// Card must still be un-activated on field (not consumed).
	const stillOnField = await page.locator('#piecies-player [data-card-id="piecie_welloe_force"]').count();
	expect(stillOnField).toBeGreaterThan(0);
});
