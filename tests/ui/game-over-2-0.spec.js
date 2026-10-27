// game-over-2-0.spec.js — Phase 64-05 (D-17 to D-22, D-40): the 2.0 game-over screen, proven live in a real browser at 1920x1080.
// Play vs Bot (Victory + engine stats + no V4 tiles / Munten + Back to Lobby), Play again with a Random bot deck rolled again,
// Watch Bots ("<Deck> wins (Bot N)" + Play again), and the URL param checks. Firebase gets the placeholder config the live site
// gets, so every test can demand zero page errors and zero console errors.
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../helpers/servePlaceholderFirebase.js';
import { forceHumanHeldLevel3Win } from '../helpers/forceHumanHeldLevel3Win.js';
import { playBotGame } from '../helpers/playBotGame.js';
import { GAME_URL_TEST, waitForBoard, ss } from './helpers.js';

test.use({ viewport: { width: 1920, height: 1080 } });

const DECK_IDS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
	page.on('console', msg => { if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`); });
	return problems;
}

// Runs in the page before every document: seeds a Play vs Bot session and a replay record, each only ONCE per tab, so a
// restart (which writes new values) is not overwritten when the next page loads.
async function seedVsBotSession(page, { withReplay }) {
	await page.addInitScript(({ withReplay }) => {
		if (sessionStorage.getItem('test:seeded')) return;
		sessionStorage.setItem('test:seeded', '1');
		sessionStorage.setItem('mosjes:offline', JSON.stringify({ name: 'TestPlayer', deckId: 'EXAMPLE_TAKSEN', botDeckId: 'EXAMPLE_REGELAARS', playerId: 'player_1' }));
		if (withReplay) sessionStorage.setItem('obby2:replay', JSON.stringify({ mode: 'vsBot', name: 'TestPlayer', deckChoice: 'EXAMPLE_TAKSEN', botChoice: 'RANDOM' }));
	}, { withReplay });
}

let problems;
test.beforeEach(async ({ page }) => {
	await servePlaceholderFirebase(page);
	problems = watchProblems(page);
});
test.afterEach(() => {
	expect(problems, 'no page error and no console error').toEqual([]);
});

test('D-19 D-21 D-22 vs Bot: Victory, 2.0 stats from the engine, no V4 tiles, no Munten, Back to Lobby', async ({ page }) => {
	test.setTimeout(120000);
	await seedVsBotSession(page, { withReplay: false });
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await forceHumanHeldLevel3Win(page);

	const overlay = page.locator('#reward-overlay');
	await expect(page.locator('.reward-title')).toHaveText('Victory!');
	await expect(overlay).toHaveAttribute('data-mode', 'vsBot');
	await expect(overlay).toHaveAttribute('data-win-reason', 'LEVEL_3');
	await expect(overlay).toHaveAttribute('data-winner-id', 'player_1');
	await expect(page.locator('.reward-subtitle')).toHaveText('TestPlayer wins!');
	await expect(page.locator('.reward-reason')).toContainText('held Level 3');

	// The numbers come from the engine state, not from a UI tracker.
	const state = await page.evaluate(() => window.__testHooks.getGameState());
	await expect(page.locator('[data-stat="rounds"]')).toHaveText(String(state.turnNumber));
	const quests = state.players.player_1.questStats;
	expect(quests.attempted).toBeGreaterThanOrEqual(1);
	await expect(page.locator('[data-stat="quests"][data-player-id="player_1"]')).toHaveText(`${quests.won}/${quests.attempted}`);
	for (const id of ['player_1', 'player_2']) {
		const lost = state.players[id].welloePile.filter(card => card.type === 'MOSJE').length;
		await expect(page.locator(`[data-stat="mosjes-lost"][data-player-id="${id}"]`)).toHaveText(String(lost));
	}

	// 2.0 words only: no V4 tiles, no Munten line or claim while the flag is off.
	const text = await overlay.innerText();
	for (const gone of ['Peak momentum', 'Biggest gain', 'Success rate', 'Munten']) expect(text).not.toContain(gone);
	await expect(page.locator('.reward-munten')).toHaveCount(0);
	await expect(page.locator('.reward-log-summary')).toBeVisible();

	// Mobile-ready (D-40): every action is a real button of at least 44 x 44.
	for (const id of ['reward-again-btn', 'reward-back-btn', 'reward-copy-btn']) {
		const box = await page.locator(`#${id}`).boundingBox();
		expect(box.width, `${id} width`).toBeGreaterThanOrEqual(44);
		expect(box.height, `${id} height`).toBeGreaterThanOrEqual(44);
	}
	const card = await page.locator('.reward-card').evaluate(el => ({ over: el.scrollHeight > el.clientHeight }));
	expect(card.over, 'the game-over card needs no scrolling at 1920x1080').toBe(false);
	await page.waitForTimeout(500); // the fade-in finishes
	await ss(page, 'game-over-2-0-vs-bot');

	await page.locator('#reward-back-btn').click();
	await page.waitForURL('**/index.html');
	await expect(page.locator('#lobby2')).toBeVisible();
});

test('D-20 Play again vs Bot keeps the decks and rolls Random again', async ({ page }) => {
	test.setTimeout(120000);
	await seedVsBotSession(page, { withReplay: true });
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await forceHumanHeldLevel3Win(page);

	await page.locator('#reward-again-btn').click();
	await page.waitForURL('**/game.html?offline=true&player=player_1');
	await waitForBoard(page);
	const session = await page.evaluate(() => ({
		offline: JSON.parse(sessionStorage.getItem('mosjes:offline')),
		replay: JSON.parse(sessionStorage.getItem('obby2:replay')),
	}));
	expect(session.offline.deckId).toBe('EXAMPLE_TAKSEN');
	expect(session.offline.name).toBe('TestPlayer');
	expect(DECK_IDS).toContain(session.offline.botDeckId);
	expect(session.replay).toMatchObject({ mode: 'vsBot', botChoice: 'RANDOM', deckChoice: 'EXAMPLE_TAKSEN' });
	await expect(page.locator('#reward-overlay')).toHaveCount(0);
});

test('D-21 Watch Bots: "<Deck> wins (Bot N)" and Play again', async ({ page }) => {
	test.setTimeout(200000);
	await page.addInitScript(() => {
		if (sessionStorage.getItem('test:seeded')) return;
		sessionStorage.setItem('test:seeded', '1');
		sessionStorage.setItem('obby2:replay', JSON.stringify({ mode: 'watchBots', bot1Choice: 'EXAMPLE_TAKSEN', bot2Choice: 'RANDOM', fast: true }));
	});
	const result = await playBotGame(page, { deck1: 'EXAMPLE_TAKSEN', deck2: 'EXAMPLE_REGELAARS', seed: 6450 });
	expect(result.finished, `the game ends (timeout: ${result.timeoutKind})`).toBe(true);
	expect(result.errors, 'no error during the bot game').toEqual([]);

	const seat = result.winnerId === 'player_1' ? 1 : 2;
	const winnerDeck = seat === 1 ? 'Taksen' : 'Regelaars';
	const title = page.locator('.reward-title');
	await expect(title).toHaveText(`${winnerDeck} wins (Bot ${seat})`);
	expect(await title.innerText()).not.toMatch(/Victory|Defeat/);
	await expect(page.locator('#reward-overlay')).toHaveAttribute('data-mode', 'watchBots');
	await expect(page.locator('.reward-subtitle')).toHaveText('Taksen (Bot 1) vs Regelaars (Bot 2)');
	await expect(page.locator('[data-stat="quests"]')).toHaveCount(2);
	await expect(page.locator('.go-player__name')).toHaveText(['Bot 1', 'Bot 2']);

	await page.locator('#reward-again-btn').click();
	await page.waitForURL(/game\.html\?.*botvsbot=true/);
	const params = new URL(page.url()).searchParams;
	expect(params.get('botvsbot')).toBe('true');
	expect(params.get('player')).toBe('player_1');
	expect(params.get('deck1')).toBe('EXAMPLE_TAKSEN');
	expect(DECK_IDS).toContain(params.get('deck2'));
	expect(params.get('fast')).toBe('true');
	await expect(page.locator('.mosje-card--owned, .mosje-card--opponent').first()).toBeVisible({ timeout: 20000 });
});
