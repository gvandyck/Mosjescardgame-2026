/**
 * graveyard-card-preview.spec.js — UX: graveyard list cards are clickable (cherry-pick of 748d44e, Phase 63-02 D-14).
 *
 * Clicking the discard pile of my row ([data-pile="discard"] on the 2.0 board) opens the list modal; every known card in
 * the list is a clickable row that opens the unified card preview (showing the card's effect text). Closing the preview
 * returns to the graveyard list.
 *
 * Pre-fix the list rendered plain <span> names only — no .graveyard-card-option buttons exist, so this spec fails on the old code.
 * The Piecie and its text come from src/data/piecies.js, so a card-text change never breaks the spec.
 */

import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST } from './helpers.js';

const PIECIE_ID = 'piecie_kannetje_melk';

test('graveyard list cards open the card preview with effect text', async ({ page }) => {
	test.setTimeout(60000);

	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	const piecie = await page.evaluate(async (id) => {
		const { PIECIES } = await import('/src/data/piecies.js');
		const { name, description } = PIECIES.find(p => p.id === id);
		return { name, description };
	}, PIECIE_ID);

	// Seed a known card into the human's graveyard so the pile is clickable.
	await page.evaluate((id) => {
		window.__testHooks.injectGraveyardCard('player_1', id);
	}, PIECIE_ID);
	// Re-render so the pile shows the injected card.
	await page.evaluate(() => window.__testHooks.rerender?.());

	// Open the graveyard list modal from the discard pile of my row.
	const discard = page.locator('[data-zone="player"] [data-pile="discard"]');
	await expect(discard).toHaveAttribute('data-count', '1');
	await discard.click();
	const listModal = page.locator('.modal-card', { hasText: 'Graveyard' });
	await expect(listModal).toBeVisible();

	// The card row is a clickable button (pre-fix: plain span, no button).
	const cardBtn = page.locator('.graveyard-card-option', { hasText: piecie.name });
	await expect(cardBtn).toBeVisible();

	// Clicking it opens the unified card preview with the effect text.
	await cardBtn.click();
	const preview = page.locator('.card-detail');
	await expect(preview).toBeVisible();
	await expect(preview).toContainText(piecie.name);
	await expect(preview).toContainText(piecie.description);

	// Closing the preview returns to the graveyard list.
	await page.click('#modal-close-preview');
	await expect(page.locator('.modal-card', { hasText: "Graveyard" })).toBeVisible();
	await expect(page.locator('.graveyard-card-option', { hasText: piecie.name })).toBeVisible();

	// Close the graveyard list — all modals gone.
	await page.click('#modal-close-graveyard');
	await expect(page.locator('.modal-card')).toHaveCount(0);
});

// T-63-03: names in the pile lists go through escapeHtml; an unknown id stays a plain, escaped, non-clickable label.
test('an unknown card id in a pile list is shown as escaped plain text', async ({ page }) => {
	test.setTimeout(60000);

	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	await page.evaluate(() => {
		window.__testHooks.injectGraveyardCard('player_1', '<b id="pwned">x</b>');
		window.__testHooks.rerender?.();
	});
	await page.locator('[data-zone="player"] [data-pile="discard"]').click();
	const listModal = page.locator('.modal-card', { hasText: 'Graveyard' });
	await expect(listModal).toBeVisible();
	await expect(listModal).toContainText('<b id="pwned">x</b>');
	await expect(page.locator('#pwned')).toHaveCount(0);
	await expect(page.locator('.graveyard-card-option')).toHaveCount(0);
});
