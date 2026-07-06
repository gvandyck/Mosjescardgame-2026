// offline-custom-deck.spec.js — Repro for the offline custom-deck crash.
//
// Bug report (2026-07-06, eightytwenty.nl/cardgame2026): a signed-in player
// whose ACTIVE deck is a custom deck (id `custom_<timestamp>`) checks
// "Play offline vs Bot" in the lobby → game.html crashes on load with
//   Uncaught Error: [ENGINE] Unknown deckId: custom_1783355721426
// Root cause: the lobby form-submit persists the custom deck definition to
// sessionStorage (`mosjes:customDeck:<id>`) only in the ONLINE flow — the
// offline branch returns early BEFORE that persistence step, so the game
// page's resolveCustomDeckDef() finds nothing and createPlayerState() throws.
//
// Drives the REAL lobby via the ?testActiveDeck=1&testCustomActive=1 hooks
// (fake signed-in user + a custom_ active deck, no Firebase), submits the
// real form with Play-offline checked, and follows the real redirect.
import { test, expect } from '@playwright/test';
import { waitForBoard, readOwnedMosjes } from './helpers.js';

async function blockFirebase(page) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
}

test.describe('Offline play with a custom active deck', () => {

	test('lobby → offline game boots when the active deck is a custom deck', async ({ page }) => {
		const pageErrors = [];
		page.on('pageerror', err => pageErrors.push(err.message));

		await blockFirebase(page);
		await page.goto('/?testActiveDeck=1&testCustomActive=1');

		// Sanity: the stub seeded the custom deck as the active deck.
		await expect(page.locator('#active-deck-panel')).toBeVisible();
		const trackedId = await page.evaluate(() => window.__testActiveDeckHook.signedInDeckId);
		expect(trackedId).toBe('custom_test_deck');

		// Fill the real form, check Play offline, submit → real redirect.
		await page.fill('#player-name', 'TestPlayer');
		await page.check('#play-offline');
		await page.click('#lobby-form button[type="submit"]');
		await page.waitForURL('**/game.html?offline=true&player=player_1', { timeout: 10000 });

		// The lobby must have persisted the custom deck def for the game page.
		const persisted = await page.evaluate(() =>
			sessionStorage.getItem('mosjes:customDeck:custom_test_deck')
		);
		expect(persisted, 'custom deck def must be in sessionStorage for the game page').not.toBeNull();

		// The game must boot: board renders an owned Mosje, no engine crash.
		await waitForBoard(page);
		const owned = await readOwnedMosjes(page);
		expect(owned.length).toBeGreaterThan(0);
		expect(pageErrors.filter(m => m.includes('Unknown deckId'))).toEqual([]);
	});
});
