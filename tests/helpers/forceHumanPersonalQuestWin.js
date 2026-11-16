// forceHumanPersonalQuestWin.js - Playwright helper (not a test file): make the human (player_1) win by a Personal Quest, through the
// real UI (hand Play button, Mosje pick, dice). Needs a page opened with testMode=true and a board that has loaded.
// Resolves when #reward-overlay is on screen; throws if it does not show within `overlayTimeout`.
import { playCardFromHand, clickModalOption } from '../ui/helpers.js';

export async function forceHumanPersonalQuestWin(page, { overlayTimeout = 40000 } = {}) {
	await page.evaluate(() => {
		const hooks = window.__testHooks;
		hooks.setHand('player_1', ['pq_charge']);
		hooks.setHand('player_2', []);
		hooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
		hooks.clearEntryProtection();
		hooks.setNextDice([6, 6, 6, 6]); // 2 dice for Str 2, both need 4+
		hooks.setTurnNumber(3);
	});
	await playCardFromHand(page, 'pq_charge');
	await clickModalOption(page, '0');
	await page.locator('.modal-mosje-select-btn[data-id="ok"]').click({ timeout: 5000 }).catch(() => {});
	await page.waitForSelector('#reward-overlay', { timeout: overlayTimeout });
}
