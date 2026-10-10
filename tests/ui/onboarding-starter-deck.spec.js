// onboarding-starter-deck.spec.js — Phase 34-02: blocking starter-deck onboarding.
// Drives the REAL lobby via the committed ?testOnboarding=1 hook (param-gated,
// stubbed claim — no Firebase). Firebase CDN + config are blocked so the page
// reaches LOCAL mode, mirroring seedOfflineSession's pattern.
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

test.describe('Onboarding starter-deck picker (blocking)', () => {

	test('0-deck trigger shows a blocking modal with exactly the 3 Example Decks and no cancel', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/?testOnboarding=1');

		// (a) Modal appears and the lobby is blocked behind it.
		const card = page.locator('#modal-root .modal-card');
		await expect(card).toBeVisible();
		await expect(card.locator('h3')).toHaveText('Choose your starter deck');
		await expect(page.locator('#modal-root')).toHaveClass(/modal-root--open/);
		await expect(page.locator('#modal-root .modal-backdrop')).toHaveCount(1);

		// (b) Exactly the 3 Example Decks — none of the 3 originals, no cancel path.
		const buttons = page.locator('.modal-mosje-select-btn');
		await expect(buttons).toHaveCount(3);
		const ids = await buttons.evaluateAll(els => els.map(el => el.dataset.id));
		expect(ids).toEqual(DECK_IDS);
		for (const original of ORIGINALS) expect(ids).not.toContain(original);
		await expect(page.locator('#modal-option-cancel')).toHaveCount(0);
	});

	test('picking a deck resolves the blocking flow and unblocks the lobby', async ({ page }) => {
		await blockFirebase(page);
		const logs = [];
		page.on('console', msg => logs.push(msg.text()));
		await page.goto('/?testOnboarding=1');

		await page.locator('.modal-mosje-select-btn[data-id="EXAMPLE_CREATIEVELINGEN"]').click();

		// (c) Modal closes: modal-root emptied and no longer open.
		await expect(page.locator('#modal-root .modal-card')).toHaveCount(0);
		await expect(page.locator('#modal-root')).not.toHaveClass(/modal-root--open/);

		// The stubbed claim logged the chosen deckId (pick resolved the promise).
		await expect
			.poll(() => logs.some(line => line.includes('picked starter deck') && line.includes('EXAMPLE_CREATIEVELINGEN')))
			.toBe(true);

		// Lobby is usable again after the pick.
		await expect(page.locator('#lobby-form')).toBeVisible();
		await expect(page.locator('#player-name')).toBeEditable();
	});

	test('without the trigger the onboarding modal never appears', async ({ page }) => {
		await blockFirebase(page);
		await page.goto('/');

		// LOCAL mode resolves auth as signed-out -> the auth gate redirects to
		// the account page. Either way: no onboarding modal is ever shown.
		await page.waitForURL(/account\.html/, { timeout: 10000 });
		await expect(page.locator('.modal-card', { hasText: 'Choose your starter deck' })).toHaveCount(0);
	});
});
