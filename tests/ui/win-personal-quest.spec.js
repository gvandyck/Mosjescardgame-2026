/**
 * win-personal-quest.spec.js - Phase 70-09 (D-01, D-28): the only win is a Level 3 Mosje completing a Personal Quest, and a human
 * can do it on the existing board: Play on the card in the hand, pick a legal Mosje, the dice, the game-over screen.
 * Headless at 1920x1080 (the Playwright "visual" project is headed: run this file through a temp config).
 */
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setHand, setEnergy, setNextDice, playCardFromHand, clickModalOption, endTurnAndWait,
} from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

async function boot(page, hand) {
	await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS');
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_1', hand);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', 3);
	return problems;
}

test('a Level 3 Mosje plays a Personal Quest from the hand and wins the game', async ({ page }) => {
	const problems = await boot(page, ['pq_charge']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await setNextDice(page, [6, 6, 6, 6]);

	await playCardFromHand(page, 'pq_charge');
	await clickModalOption(page, '0'); // which Mosje: the Level 3 Physical one
	// the dice modal ("Continue"), then the result
	await page.locator('.modal-mosje-select-btn[data-id="ok"]').click({ timeout: 5000 }).catch(() => {});

	const overlay = page.locator('#reward-overlay');
	await expect(overlay).toBeVisible({ timeout: 15000 });
	await expect(overlay).toHaveAttribute('data-win-reason', 'PERSONAL_QUEST');
	await expect(overlay).toHaveAttribute('data-winner-id', 'player_1');
	await expect(page.locator('.reward-reason')).toContainText('completed Charge! with');
	await expect(page.locator('.reward-reason')).toContainText('Alyssa');
	await expect(page.locator('.go-winning-quest .card-v1')).toBeVisible();
	const gs = await getGameState(page);
	expect(gs.status).toBe('FINISHED');
	expect(gs.winReason).toBe('PERSONAL_QUEST');
	expect(problems).toEqual([]);
});

test('no legal Mosje: the modal says why and the game goes on', async ({ page }) => {
	const problems = await boot(page, ['pq_charge']);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 2 });
	await clearEntryProtection(page);

	await playCardFromHand(page, 'pq_charge');
	// 72-04: the tap opens the detail; Play is off and the reason names Level 3.
	await expect(page.locator('.modal-card, .modal-content').first()).toContainText('Level 3', { timeout: 5000 });
	await page.locator('#modal-close-preview').click();
	const gs = await getGameState(page);
	expect(gs.status).toBe('PLAYING');
	expect(gs.players.player_1.hand.map(c => c.cardId)).toContain('pq_charge');
	expect(problems).toEqual([]);
});

test('a normal turn is still playable: place a Piecie and end the turn', async ({ page }) => {
	const problems = await boot(page, ['piecie_affoe']);
	await playCardFromHand(page, 'piecie_affoe');
	await expect.poll(async () => (await getGameState(page)).players.player_1.piecieSlots.filter(Boolean).length).toBe(1);
	await endTurnAndWait(page);
	const gs = await getGameState(page);
	expect(gs.status).toBe('PLAYING');
	expect(problems).toEqual([]);
});
