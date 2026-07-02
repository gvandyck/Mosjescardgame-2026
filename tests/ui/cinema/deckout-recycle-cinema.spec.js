/**
 * deckout-recycle-cinema.spec.js — "Cinema mode" demo of the Phase 33 deck-out notice.
 *
 * A deliberately SLOW, narrated walkthrough so a human can watch it play out: Binti's
 * draw deck runs dry → on her next draw the discard reshuffles into a fresh deck → the
 * ~3s "DECK RECYCLED" banner rises in the centre, her discard pile pulses, and the battle
 * log records that she skips her next turn (1-turn cooldown) → the banner fades away.
 *
 * It still asserts the real outcome, so it doubles as a visual regression check.
 * Runs in the `visual` project (headed + slowMo). Watch it:
 *   npx playwright test --project=visual tests/ui/cinema/deckout-recycle-cinema.spec.js --headed
 * Tune the pause between beats with CINEMA=<ms> (default ~2.2s when headed).
 */

import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST, readLog, ss } from '../helpers.js';

test('🎬 Deck-out cinema — discard reshuffles, "DECK RECYCLED" notice plays', async ({ page }, testInfo) => {
	test.setTimeout(120000);

	// Pause between story beats when watching (headed project) so it plays like a clip;
	// 0 in headless runs so CI/quick checks stay fast. Override with CINEMA=<ms>.
	const BEAT = Number(process.env.CINEMA) || (testInfo.project.use.headless === false ? 2200 : 0);
	const beat = (label) => { if (label) console.log(`🎬 ${label}`); return BEAT ? page.waitForTimeout(BEAT) : Promise.resolve(); };

	// ── Scene 1: set the stage ────────────────────────────────────────────────
	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await beat('Scene 1 — Binti (you) vs DDR Chris (bot)');

	await page.evaluate(() => {
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_binti', { mp: 95, level: 0 });
		window.__testHooks.setMosjeOnField('player_2', 0, 'mosje_chris_ddr', { mp: 50, level: 0 });
	});
	await ss(page, 'cinema-deckout-1-board');
	await beat('Binti is healthy at 95 MP — but her deck is about to run dry…');

	// Arm the deck-out: empty Binti's deck, seed her discard so the next draw reshuffles.
	await page.evaluate(() => {
		window.__testHooks.emptyDeck('player_1');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
	});
	await ss(page, 'cinema-deckout-2-armed');
	await beat('Scene 2 — deck emptied, 2 cards sit in her discard pile');

	// ── Scene 3: end turn → bot plays → Binti's draw reshuffles (fires the notice) ──
	await beat('Ending the turn… the bot plays, then Binti tries to draw with an empty deck');
	await page.click('#btn-end-turn');

	// The ~3s "DECK RECYCLED" banner appears centre-screen.
	const banner = page.locator('.deckout-banner');
	await banner.waitFor({ state: 'visible', timeout: 30000 });
	await expect(banner).toContainText('DECK RECYCLED');
	await expect(banner).toContainText(/reshuffled/i);
	await expect(banner).toContainText(/skips next turn/i);

	// Catch the discard-pile pulse while its ~2s animation is running, then snapshot.
	await page.waitForFunction(
		() => document.querySelector('#discard-player.discard-pile--recycling') !== null,
		null, { timeout: 3000 }
	);
	await ss(page, 'cinema-deckout-3-banner');
	await beat('♻ DECK RECYCLED — discard reshuffled into a new deck; her pile pulses');

	// Permanent battle-log record.
	const rows = await readLog(page);
	expect(rows.some(r => /deck ran out/i.test(r) && /skips their next turn/i.test(r))).toBe(true);
	await beat('The battle log notes she skips her next turn (1-turn cooldown)');

	// ── Scene 4: the banner fades away on its own ─────────────────────────────
	await banner.waitFor({ state: 'detached', timeout: 6000 });
	await ss(page, 'cinema-deckout-4-cleared');
	await beat('Scene 4 — the notice fades; play continues. 🎬 fin');
});
