// Phase 57-01: regression guard for the missing Piecie Activate button (found headless in 56-09).
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard,
	playCardFromHand, endTurnAndWait, getGameState, isPiecieOnField,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';

const PIECIE = 'piecie_kannetje_melk';

test('an own ready Piecie shows Activate and activating discards it', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await page.evaluate((id) => window.__testHooks.setHand('player_1', [id]), PIECIE);
	await playCardFromHand(page, PIECIE);
	await expect.poll(() => isPiecieOnField(page, PIECIE)).toBe(true);

	await endTurnAndWait(page);

	const state = await getGameState(page);
	const slot = state.players.player_1.piecieSlots.find((s) => s && s.cardId === PIECIE);
	expect(slot, 'Piecie still in its slot').toBeTruthy();
	expect(state.turnNumber).toBeGreaterThanOrEqual(slot.canActivateOnTurn);
	expect(state.activePlayerId).toBe('player_1');

	await expect(
		page.locator(`#piecies-player [data-card-id="${PIECIE}"] button:has-text("Activate")`),
	).toBeVisible();
	await activatePiecieOnField(page, PIECIE);

	const after = await getGameState(page);
	expect(after.players.player_1.piecieSlots.some((s) => s && s.cardId === PIECIE)).toBe(false);
	expect(after.players.player_1.graveyard.some((c) => c.cardId === PIECIE)).toBe(true);
});
