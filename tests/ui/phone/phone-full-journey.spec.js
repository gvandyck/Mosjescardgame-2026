/**
 * phone-full-journey.spec.js - Phase 72.1-12 (D-09, MOB-09): a whole 2.1 game path on a phone, by touch only, at 395x731, 390x844 and
 * 360x740. Leg A is the real lobby path (a lobby start carries no testMode, so no hooks): deck tile, Show cards / Hide cards, Start,
 * the starting-Mosje pick (swipe once, tap the second face), the Draw step, End Turn (confirm sheet when a Mosje can still act), the
 * bot's whole turn (a reaction window answered "No reaction"), and the human's second turn. Leg B opens the test URL and uses the
 * hooks only to reach the Personal Quest win: play the quest from the drawer, game over names the winning quest, Play again asks the
 * pick and starts a new game, a knockout ends it again, Back to Lobby shows the lobby. Every screen goes through expectPhoneScreenSound
 * and any page or console error fails the test.
 */
import { test, expect } from '@playwright/test';
import { servePlaceholderFirebase } from '../../helpers/servePlaceholderFirebase.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../../helpers/phoneViewports.js';
import { expectPhoneScreenSound } from '../../helpers/phoneGate.js';
import { savePhoneShot } from '../../helpers/savePhoneShot.js';
import { swipe } from '../../helpers/phoneSwipe.js';
import { answerDrawStep } from '../../helpers/answerDrawStep.js';
import { touchEndTurn } from '../../helpers/touchEndTurn.js';
import { phoneHumanPersonalQuestWin } from '../../helpers/phoneHumanPersonalQuestWin.js';
import { GAME_URL_TEST, waitForBoard } from '../helpers.js';

const TILES = '[data-picker="player-deck"] .deck-tile';
const TOGGLE = '[data-picker="player-deck"] ~ .deck-tiles__toggle';

function watchProblems(page) {
	const problems = [];
	page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
	page.on('console', (msg) => { if (msg.type() === 'error') problems.push(`console: ${msg.text()}`); });
	return problems;
}

/** Wait (up to 60 s) until End Turn is enabled for the human, answering a Reaction window ("No reaction") or the Draw step by tap. */
async function waitForHumanTurnByTouch(page) {
	const noReaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	await expect.poll(async () => {
		if (await noReaction.isVisible().catch(() => false)) await noReaction.tap().catch(() => {});
		if (await draw.first().isVisible().catch(() => false)) await draw.first().tap().catch(() => {});
		// A lobby start has no test hooks: read the turn from the screen (label "You ..." and an enabled End Turn).
		const label = (await page.locator('#turn-label').textContent().catch(() => '')) || '';
		return label.trim().startsWith('You') && !(await page.locator('#btn-end-turn').isDisabled());
	}, { timeout: 60000, intervals: [250] }).toBe(true);
}

for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone full journey at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = watchProblems(page);
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('leg A: lobby, pick, a turn, End Turn, the bot turn, the next human turn', async ({ page }) => {
			test.setTimeout(180000);
			await page.goto('/');
			await expect(page.locator(TILES)).toHaveCount(3, { timeout: 15000 });
			await expectPhoneScreenSound(page, { name: 'lobby', scrollsVertically: true });
			const toggle = page.locator(TOGGLE);
			await toggle.scrollIntoViewIfNeeded();
			await toggle.tap();
			await expect(toggle).toHaveText('Hide cards');
			await toggle.tap();
			await expect(toggle).toHaveText('Show cards');
			await page.locator(TILES).nth(1).tap();
			await page.locator('#lobby2-start').tap({ timeout: 8000 });
			await page.waitForURL(/game\.html/, { timeout: 15000 });

			const pick = page.locator('.modal-card--cards');
			await expect(pick).toBeVisible({ timeout: 20000 });
			await expectPhoneScreenSound(page, { name: 'starting pick' });
			const rowBox = await page.locator('.modal-card--cards .modal-mosje-select-list').boundingBox();
			const y = rowBox.y + rowBox.height / 2;
			await swipe(page, { from: { x: rowBox.x + rowBox.width * 0.8, y }, to: { x: rowBox.x + rowBox.width * 0.2, y } });
			await page.waitForTimeout(800); // the snap-scroll settles before the tap (a tap on a moving face picks nothing)
			// Headless Chromium sometimes drops the click of the FIRST synthetic tap after a CDP swipe (see phone-lobby-start (e)): tap until the pick is gone, at most three times.
			for (let attempt = 0; attempt < 3 && await pick.count(); attempt++) {
				await page.locator('.modal-card--cards .modal-option--card').nth(1).tap().catch(() => {});
				await page.waitForTimeout(600);
			}
			await waitForBoard(page);
			// The opening die decides who starts: when the bot opens it plays its turn first (bot-opens-game.spec.js guards that).
			await waitForHumanTurnByTouch(page);
			await answerDrawStep(page);
			await expectPhoneScreenSound(page, { name: 'board turn 1' });

			const before = await page.evaluate(() => document.getElementById('btn-end-turn')?.textContent || '');
			expect(before.length, 'End Turn is in the bar').toBeGreaterThan(0);
			await touchEndTurn(page);
			await expect(page.locator('#btn-end-turn')).toBeDisabled({ timeout: 10000 }); // the turn passed to the bot
			await waitForHumanTurnByTouch(page); // the bot's whole turn; a reaction window is answered "No reaction"
			await answerDrawStep(page);
			await expectPhoneScreenSound(page, { name: 'board turn 2' });
			if (vp.name === PIXEL_VIEWPORT.name) await savePhoneShot(page, '72.1-12-final-board'); // mid-game, hand drawer closed, badges, bar
		});
	});

	test.describe(`phone full journey, Personal Quest to game over at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		let problems;
		test.beforeEach(async ({ page }) => {
			await servePlaceholderFirebase(page);
			problems = watchProblems(page);
			await page.addInitScript(() => {
				if (sessionStorage.getItem('test:seeded')) return;
				sessionStorage.setItem('test:seeded', '1');
				sessionStorage.setItem('mosjes:offline', JSON.stringify({ name: 'TestPlayer', deckId: 'STARTER_PHYSICAL', botDeckId: 'STARTER_DIGITAL', playerId: 'player_1' }));
				sessionStorage.setItem('obby2:replay', JSON.stringify({ mode: 'vsBot', name: 'TestPlayer', deckChoice: 'STARTER_PHYSICAL', botChoice: 'RANDOM' }));
			});
		});
		test.afterEach(() => {
			expect(problems, 'no page error and no console error').toEqual([]);
		});

		test('leg B: win by Personal Quest, game over names it, Play again starts a new game', async ({ page }) => {
			test.setTimeout(240000);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			await phoneHumanPersonalQuestWin(page);
			await expect(page.locator('#reward-overlay')).toBeVisible();
			await page.waitForTimeout(700);
			await expect(page.locator('.reward-reason')).toContainText('completed Charge! with');
			await expect(page.locator('.go-winning-quest .dice-row > *').first()).toBeVisible();
			await expectPhoneScreenSound(page, { name: 'game over (win)', scrollsVertically: true });

			await page.locator('#reward-again-btn').tap();
			await page.waitForURL(/game\.html/);
			await expect(page.locator('.modal-card--cards .modal-option--card').first()).toBeVisible({ timeout: 20000 });
			await page.locator('.modal-card--cards .modal-option--card').first().tap();
			await waitForBoard(page);
			await expect(page.locator('#reward-overlay')).toHaveCount(0);
		});

		test('leg B2: a knockout ends the game, Back to Lobby shows the lobby', async ({ page }) => {
			test.setTimeout(150000);
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			await page.evaluate(() => window.__testHooks.forceKnockout('player_2'));
			await expect(page.locator('#reward-overlay')).toBeVisible({ timeout: 15000 });
			await page.waitForTimeout(700);
			await expectPhoneScreenSound(page, { name: 'game over (knockout)', scrollsVertically: true });
			await page.locator('#reward-back-btn').tap();
			await page.waitForURL('**/index.html');
			await expect(page.locator('#lobby2')).toBeVisible();
		});
	});
}
