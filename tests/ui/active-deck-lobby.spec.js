// active-deck-lobby.spec.js — Phase 34-03: lobby active-deck rewiring.
// Drives the REAL lobby via two committed, param-gated test hooks
// (?testGuestDeck=1 and ?testActiveDeck=1) that bypass the Firebase auth
// gate but exercise the exact real handleLobbyAuthChange / setupActiveDeckPanel
// code — no Firebase calls, no test-only duplicate implementation.
// Firebase CDN + config are blocked so the page reaches LOCAL mode, mirroring
// the 34-02 onboarding spec's pattern.
import { test, expect } from '@playwright/test';

const DECK_IDS = [
	'EXAMPLE_TAKSEN',
	'EXAMPLE_REGELAARS',
	'EXAMPLE_CREATIEVELINGEN',
];
const ORIGINALS = ['PHYSICAL_FORCE', 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM'];

async function blockFirebase(page) {
	await page.route('**gstatic.com/**', route => route.abort());
	await page.route('**/firebase-config.js', route => route.abort());
}

test.describe('Lobby: guest dropdown (duo-only)', () => {

	test('guest #deck-select lists exactly the 3 Example Decks, no originals', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/?testGuestDeck=1');

		const options = page.locator('#deck-select option');
		await expect(options).toHaveCount(3);
		const values = await options.evaluateAll(els => els.map(el => el.value));
		expect(values).toEqual(DECK_IDS);
		for (const original of ORIGINALS) expect(values).not.toContain(original);

		// Guest keeps the (now duo-only) dropdown, not the active-deck panel.
		await expect(page.locator('#active-deck-panel')).toBeHidden();
	});
});

test.describe('Lobby: signed-in active-deck panel + Change-deck switcher (live)', () => {

	test('panel renders the seeded active deck; dropdown is hidden', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/?testActiveDeck=1');

		await expect(page.locator('#deck-select')).toBeHidden();
		const panel = page.locator('#active-deck-panel');
		await expect(panel).toBeVisible();
		await expect(panel.locator('.active-deck-panel__name')).toHaveText("Taksen");
		// Deck contents are intentionally NOT shown — the name is plenty.
		await expect(panel.locator('.active-deck-panel__mosjes')).toHaveCount(0);

		// The tracked signed-in deck id (what game-start would read) matches
		// the seeded active deck.
		const trackedId = await page.evaluate(() => window.__testActiveDeckHook.signedInDeckId);
		expect(trackedId).toBe('EXAMPLE_TAKSEN');
	});

	test('Change deck opens a switcher listing the seeded decks; picking a different one re-renders the panel and updates the tracked active id', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/?testActiveDeck=1');

		await expect(page.locator('#active-deck-panel')).toBeVisible();
		await page.locator('#btn-change-deck').click();

		// Switcher lists exactly the seeded (>=2) decks.
		const buttons = page.locator('.modal-mosje-select-btn');
		await expect(buttons).toHaveCount(2);
		const ids = await buttons.evaluateAll(els => els.map(el => el.dataset.id));
		expect(ids).toEqual(['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS']);

		// Pick the OTHER seeded deck.
		await page.locator('.modal-mosje-select-btn[data-id="EXAMPLE_REGELAARS"]').click();

		// Modal closes; panel re-renders to the newly picked deck.
		await expect(page.locator('#modal-root .modal-card')).toHaveCount(0);
		const panel = page.locator('#active-deck-panel');
		await expect(panel.locator('.active-deck-panel__name')).toHaveText('Regelaars');

		// The new active id is exactly what game-start would read.
		const trackedId = await page.evaluate(() => window.__testActiveDeckHook.signedInDeckId);
		expect(trackedId).toBe('EXAMPLE_REGELAARS');
	});

	test('Cancelling the switcher leaves the active deck unchanged', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/?testActiveDeck=1');

		await page.locator('#btn-change-deck').click();
		await expect(page.locator('.modal-mosje-select-btn')).toHaveCount(2);
		await page.locator('#modal-option-cancel').click();

		await expect(page.locator('#modal-root .modal-card')).toHaveCount(0);
		const panel = page.locator('#active-deck-panel');
		await expect(panel.locator('.active-deck-panel__name')).toHaveText("Taksen");
		const trackedId = await page.evaluate(() => window.__testActiveDeckHook.signedInDeckId);
		expect(trackedId).toBe('EXAMPLE_TAKSEN');
	});
});
