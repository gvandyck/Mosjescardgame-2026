// phoneHumanPersonalQuestWin.js - Playwright helper (not a test file): the phone twin of forceHumanPersonalQuestWin. Same stage, but the
// Personal Quest is raised from the hand drawer and played with real taps (the phone has no hover Play button).
// Needs a page opened with testMode=true and a loaded board. Resolves when #reward-overlay is on screen.
import { raiseCard } from './phoneRaise.js';

export async function phoneHumanPersonalQuestWin(page, { overlayTimeout = 40000 } = {}) {
	await page.evaluate(() => {
		const hooks = window.__testHooks;
		hooks.setHand('player_1', ['pq_charge']);
		hooks.setHand('player_2', []);
		hooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
		hooks.clearEntryProtection();
		hooks.setNextDice([6, 6, 6, 6]);
		hooks.setTurnNumber(3);
	});
	await page.waitForTimeout(400);
	await raiseCard(page, 'pq_charge');
	await page.locator('[data-raise-play]').tap();
	const pick = page.locator('.modal-mosje-select-btn[data-id="0"]');
	await pick.waitFor({ state: 'visible', timeout: 5000 });
	await pick.tap();
	await page.locator('.modal-mosje-select-btn[data-id="ok"]').tap({ timeout: 5000 }).catch(() => {});
	await page.waitForSelector('#reward-overlay', { timeout: overlayTimeout });
}

