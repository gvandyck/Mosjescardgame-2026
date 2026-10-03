import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setHand, endTurnAndWait, ss } from '../helpers.js';

// A bot play must open a spotlight (bot steps never call animateFieldActivation).
test('bot playing a Mosje spotlights the card', async ({ page }) => {
	page.on('pageerror', e => console.log('[PAGEERR]', e.message));
	await page.setViewportSize({ width: 1600, height: 900 });
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setHand(page, 'player_2', ['mosje_gandoe_wizard', 'mosje_jeffrey']);
	await page.evaluate(() => {
		window.__spotSeen = [];
		new MutationObserver(() => {
			const el = document.querySelector('.card-spotlight .uc-title');
			if (el && !window.__spotSeen.includes(el.textContent)) window.__spotSeen.push(el.textContent);
		}).observe(document.body, { childList: true, subtree: true });
	});
	await page.click('#btn-end-turn');
	await page.waitForFunction(() => window.__spotSeen.length > 0, null, { timeout: 25000 });
	await ss(page, 'arena-7-bot-spotlight');
	console.log('spotlights seen:', await page.evaluate(() => window.__spotSeen));
	expect(await page.evaluate(() => window.__spotSeen.length)).toBeGreaterThan(0);
});
