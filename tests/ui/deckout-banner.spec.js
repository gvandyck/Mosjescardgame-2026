/**
 * deckout-banner.spec.js — Phase 33 visual-tester spec.
 *
 * Proves the deck-out RECYCLE NOTICE fires in a real browser: when the human's draw deck
 * empties, the D-06 reshuffle runs and the UI shows a center "DECK RECYCLED" banner, a
 * battle-log line, and a pulse on the human's discard pile — then the banner auto-dismisses.
 *
 * Setup mirrors deckout-hang-repro.spec.js (empty deck + seed discard so the next draw
 * reshuffles). Against pre-Phase-33 code there is no .deckout-banner element, so this spec
 * fails first; after implementation it passes.
 */

import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST, readLog, ss } from './helpers.js';

test('deck-out shows a recycle banner + log line + discard pulse', async ({ page }) => {
	test.setTimeout(90000);

	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Keep the human alive long enough to reach the reshuffle draw, and arm the deck-out.
	await page.evaluate(() => {
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_binti', { mp: 95, level: 0 });
		window.__testHooks.setMosjeOnField('player_2', 0, 'mosje_chris_ddr', { mp: 50, level: 0 });
		window.__testHooks.emptyDeck('player_1');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
	});

	// End turn -> bot plays -> the human's next draw phase reshuffles (fires the event).
	await page.click('#btn-end-turn');

	// Banner appears (this element does not exist pre-implementation -> fails first).
	const banner = page.locator('.deckout-banner');
	await banner.waitFor({ state: 'visible', timeout: 30000 });
	await expect(banner).toContainText('DECK RECYCLED');
	await expect(banner).toContainText(/reshuffled/i);
	await expect(banner).toContainText(/skips next turn/i);

	// Discard pile pulse toggled on the human's own pile (transient; catch it while the
	// ~2s pulse animation is running, right after the banner shows).
	await page.waitForFunction(
		() => document.querySelector('#discard-player.discard-pile--recycling') !== null,
		null,
		{ timeout: 3000 }
	);

	await ss(page, 'deckout-recycle-banner');   // visual artifact (cinema style)

	// Permanent battle-log record is present.
	const rows = await readLog(page);
	expect(rows.some(r => /deck ran out/i.test(r) && /skips their next turn/i.test(r))).toBe(true);

	// Auto-dismiss within ~3s.
	await banner.waitFor({ state: 'detached', timeout: 6000 });
});
