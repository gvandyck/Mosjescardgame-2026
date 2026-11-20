/**
 * starting-mosje-pick.spec.js - Phase 72-13 (D-15): a lobby game asks for the starting Mosje; any other start is immediate.
 * Headless 1920x1080 (temp config).
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from './helpers.js';
import { STARTER_DECKS_21 } from '../../src/data/starterDecks21.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const digital = STARTER_DECKS_21.find(d => d.id === 'STARTER_DIGITAL');
const physical = STARTER_DECKS_21.find(d => d.id === 'STARTER_PHYSICAL');

async function seedPick(page) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
	await page.addInitScript(() => {
		sessionStorage.setItem('mosjes:offline', JSON.stringify({
			name: 'TestPlayer', deckId: 'STARTER_DIGITAL', botDeckId: 'STARTER_PHYSICAL', playerId: 'player_1', pickStart: true,
		}));
	});
}

test('the modal shows the deck\'s 5 Mosjes as faces; the pick lands on the field, not in the deck', async ({ page }) => {
	await seedPick(page);
	await page.goto(GAME_URL_TEST);
	const modal = page.locator('.modal-card--cards');
	await expect(modal).toBeVisible();
	await expect(modal.locator('h3')).toHaveText('Choose your starting Mosje');
	await expect(modal.locator('.card-v1')).toHaveCount(5);
	await page.screenshot({ path: '.planning/phases/72-screens-for-the-new-design/shots/72-13-starting-mosje.png' });
	await modal.locator('.modal-mosje-select-btn').nth(2).click();
	await waitForBoard(page);
	const state = await page.evaluate(() => window.__testHooks.getGameState());
	const me = state.players.player_1;
	expect(me.activeSlots[0].cardId).toBe(digital.mosjes[2]);
	expect([...me.deck, ...me.hand].some(c => c.cardId === digital.mosjes[2])).toBe(false);
	expect(physical.mosjes).toContain(state.players.player_2.activeSlots[0].cardId);
});

test('without pickStart the game starts at once, no modal', async ({ page }) => {
	await seedOfflineSession(page, 'PHYSICAL_FORCE', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await expect(page.locator('.modal-card--cards')).toHaveCount(0);
});
