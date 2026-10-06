// Phase 51: every game-state change rebuilds the hand and board. The slide-in animation used to
// replay on ALL cards for any event (even +10 MP on one Mosje): the whole table flickered.
// Now only cards that are new since the previous render animate.
import { test, expect } from '@playwright/test';
import { seedOfflineSession, GAME_URL_TEST } from '../helpers.js';

test('state change does not replay the enter animation on existing cards', async ({ page }) => {
	await page.setViewportSize({ width: 1600, height: 900 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await page.waitForFunction(() => window.__testHooks?.getGameState?.()?.players, null, { timeout: 30000 });
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.setMosjeOnField('player_1', 0, 'mosje_hacker', { mp: 15 });
		h.setHand('player_1', ['mosje_hacker', 'piecie_call_of_welloes', 'snelle_lucky_coin', 'place_the_gym']);
	});
	await page.waitForTimeout(1500); // let the first enter animations finish
	const slideIns = () => page.evaluate(() => document.getAnimations().filter((a) => a.animationName === 'card-slide-in' && a.playState === 'running').length);
	expect(await slideIns(), 'nothing animating at rest').toBe(0);
	await page.evaluate(() => window.__testHooks.setMosjeMP('player_1', 0, 25)); // +10 MP on one Mosje
	await page.waitForTimeout(120);
	expect(await slideIns(), 'cards that were already there must not animate again').toBe(0);
	await page.evaluate(() => window.__testHooks.injectHandCard('player_1', 'piecie_leipe_swap')); // a genuinely new card
	await page.waitForTimeout(120);
	expect(await slideIns(), 'only the new card slides in').toBe(1);
});
