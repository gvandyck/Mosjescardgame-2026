// waitForMyTurnByTouch.js - Phase 65-09: wait until the bot has played a whole turn and it is the human's turn again, tapping away
// anything that blocks on the way (a Reaction prompt: "No reaction"; the Draw step: "Draw normally"). The touch twin of the
// waitForMyTurn in tap-only-turn.spec.js.
import { expect } from '@playwright/test';
import { getGameState } from '../ui/helpers.js';

/** @param {import('@playwright/test').Page} page */
export async function waitForMyTurnByTouch(page) {
	const noReaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
	const drawStep = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	let sawBot = false;
	await expect.poll(async () => {
		if (await noReaction.isVisible().catch(() => false)) await noReaction.tap().catch(() => {});
		if (await drawStep.isVisible().catch(() => false)) await drawStep.first().tap().catch(() => {});
		const gs = await getGameState(page);
		if (gs.activePlayerId === 'player_2') sawBot = true;
		return sawBot && gs.activePlayerId === 'player_1' && !(await page.locator('#btn-end-turn').isDisabled());
	}, { timeout: 40000, intervals: [200] }).toBe(true);
}
