// Phase 57-01: regression guard for the missing Piecie Activate button (found headless in 56-09).
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard,
	playCardFromHand, endTurnAndWait, getGameState, isPiecieOnField,
} from './helpers.js';
import { activatePiecieOnField } from '../helpers/piecieUi.js';
import { readTrayChip } from '../helpers/boardTaps.js';

const PIECIE = 'piecie_kannetje_melk';

test('an own ready Piecie shows Activate and activating discards it', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await page.evaluate((id) => window.__testHooks.setHand('player_1', [id]), PIECIE);
	await playCardFromHand(page, PIECIE);
	await expect.poll(() => isPiecieOnField(page, PIECIE)).toBe(true);

	// Placed this turn: the tray offers Activate, but dimmed (not ready yet).
	const notReady = await readTrayChip(page, 'piecie', PIECIE, 'activate');
	expect(notReady.present, 'the tray offers Activate').toBe(true);
	expect(notReady.disabled, 'Activate is dimmed until the Piecie is ready').toBe(true);

	await endTurnAndWait(page);

	const state = await getGameState(page);
	const slot = state.players.player_1.piecieSlots.find((s) => s && s.cardId === PIECIE);
	expect(slot, 'Piecie still in its slot').toBeTruthy();
	expect(state.turnNumber).toBeGreaterThanOrEqual(slot.canActivateOnTurn);
	expect(state.activePlayerId).toBe('player_1');

	// Ready now: the Activate chip in the Piecie's tray is there and enabled (the tile itself has no button).
	const ready = await readTrayChip(page, 'piecie', PIECIE, 'activate');
	expect(ready.present, 'the tray offers Activate').toBe(true);
	expect(ready.disabled, 'Activate is enabled when the Piecie is ready').toBe(false);
	await expect(page.locator(`#piecies-player [data-card-id="${PIECIE}"] button`)).toHaveCount(0);
	await activatePiecieOnField(page, PIECIE);

	const after = await getGameState(page);
	expect(after.players.player_1.piecieSlots.some((s) => s && s.cardId === PIECIE)).toBe(false);
	expect(after.players.player_1.graveyard.some((c) => c.cardId === PIECIE)).toBe(true);
});
