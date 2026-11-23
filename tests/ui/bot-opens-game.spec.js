/**
 * bot-opens-game.spec.js - when the opening die makes the bot the first player, the bot must play its turn and hand over.
 *
 * The bug (found in 72.1-12): startGame never started the bot's turn, so a lobby game the bot opened froze on "Bot's turn"
 * for ever. testMode forced player_1 first, which hid it from every test. Here testMode's firstPlayer=player_2 makes the bot open.
 */
import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST } from './helpers.js';

const BOT_FIRST_URL = `${GAME_URL_TEST}&firstPlayer=player_2`;
const getState = (page) => page.evaluate(() => window.__testHooks?.getGameState() ?? null);

/** Wait until the human (player_1) is active with End Turn enabled; a Reaction window is answered "No reaction", a Draw step "draw". */
async function waitForHumanControl(page, timeout) {
	const noReaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	await expect.poll(async () => {
		if (await noReaction.isVisible().catch(() => false)) await noReaction.click({ timeout: 2000 }).catch(() => {});
		if (await draw.first().isVisible().catch(() => false)) await draw.first().click({ timeout: 2000 }).catch(() => {});
		return page.evaluate(() => {
			const gs = window.__testHooks?.getGameState();
			const btn = document.getElementById('btn-end-turn');
			return !!gs && gs.activePlayerId === 'player_1' && !!btn && btn.disabled === false;
		});
	}, { timeout, intervals: [250], message: 'the bot plays its opening turn and the human gets control' }).toBe(true);
}

for (const [humanDeck, botDeck] of [['STARTER_PHYSICAL', 'STARTER_DIGITAL'], ['STARTER_DIGITAL', 'STARTER_CREATIVE']]) {
	test(`the bot opens the game, plays its turn and hands over (${humanDeck} vs ${botDeck})`, async ({ page }) => {
		test.setTimeout(90000);
		const problems = [];
		page.on('pageerror', (err) => problems.push(err.message));

		await seedOfflineSession(page, humanDeck, botDeck);
		await page.goto(BOT_FIRST_URL);
		await waitForBoard(page);

		const opening = await getState(page);
		expect(opening.firstPlayerId, 'the bot is the first player').toBe('player_2');
		expect(opening.turnNumber).toBe(1);

		await waitForHumanControl(page, 45000);

		const after = await getState(page);
		expect(after.status).not.toBe('FINISHED');
		expect(after.activePlayerId).toBe('player_1');
		expect(after.turnNumber, 'still round 1: the round counter moves only when play is back at the first player').toBe(1);
		await expect(page.locator('#turn-label')).toContainText('You');
		expect(problems, 'no page error').toEqual([]);
	});
}
