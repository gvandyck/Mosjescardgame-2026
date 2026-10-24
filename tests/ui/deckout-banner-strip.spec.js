/**
 * deckout-banner-strip.spec.js - 63-06: the deck-out "DECK RECYCLED" banner (Phase 33) must never cover the status strip
 * (63-04 noted it still did for about 3 s, through its fade-in/out offset). The real showDeckOutBanner is run on the live
 * board and its box is sampled over the whole animation: its top edge stays at or below the strip's bottom edge.
 */
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard } from './helpers.js';

test('the deck-out banner stays below the status strip for its whole animation', async ({ page }) => {
	test.setTimeout(60000);
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	const samples = await page.evaluate(async () => {
		const { showDeckOutBanner } = await import('/src/ui/actionAnimations.js');
		const strip = document.getElementById('status-strip');
		showDeckOutBanner({ playerName: 'Test' });
		const banner = document.querySelector('.deckout-banner');
		const out = [];
		const t0 = performance.now();
		while (banner && document.body.contains(banner) && performance.now() - t0 < 4000) {
			out.push({ t: Math.round(performance.now() - t0), bannerTop: banner.getBoundingClientRect().top, stripBottom: strip.getBoundingClientRect().bottom });
			await new Promise((resolve) => setTimeout(resolve, 40));
		}
		return out;
	});

	expect(samples.length, 'the banner was sampled while it animated').toBeGreaterThan(20);
	for (const s of samples) expect(s.bannerTop, `banner top vs strip bottom at ${s.t} ms`).toBeGreaterThanOrEqual(s.stripBottom);
});
