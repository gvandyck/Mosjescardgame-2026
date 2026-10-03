/**
 * Full-game simulation tests.
 *
 * These tests play a complete game from start to win screen and assert the
 * entire flow: board loads, turns alternate, a win condition fires, and the
 * reward overlay renders with the correct winner and reason.
 *
 * Average game length: 9–11 turns (from simulation data).
 * Max per test: 30 turns before failing (safety cap, well above real-world max).
 *
 * Three test scenarios:
 *   1. Passive game   — human just ends every turn, bot drives to KNOCKOUT/LEVEL_3
 *   2. Active game    — human attempts a quest + plays a piecie each turn
 *   3. All three decks — one passive game per starter deck combination
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	seedOfflineSession,
	waitForBoard,
	ss,
	readLog,
	readOwnedMosjes,
	endTurnAndWait,
	setMosjeMP,
	playCardFromHand,
	readHand,
	mockDiceRoll,
} from './helpers.js';

// Valid win reasons the overlay must show
const WIN_REASONS = ['LEVEL_3', 'KNOCKOUT', 'QUEST_MASTER', 'MOMENTUM_DOMINATION'];

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Wait for the reward overlay to appear (game ended).
 * Returns { winnerName, winReason, outcome } read from the overlay text.
 */
async function waitForGameOver(page, timeout = 90000) {
	await page.waitForSelector('#reward-overlay', { timeout });
	const subtitle = await page.locator('.reward-subtitle').textContent().catch(() => '');
	const title = await page.locator('.reward-title').textContent().catch(() => '');
	const reason = await page.locator('.reward-reason').textContent().catch(() => '');
	console.log('Game over:', title, '|', subtitle, '|', reason);
	return { title: title.trim(), subtitle: subtitle.trim(), reason: reason.trim() };
}

/**
 * Play one human turn actively:
 * - Attempt General Quest if available and not yet attempted
 * - Play one Piecie from hand if available
 * - End turn and wait for bot
 *
 * Returns false if the game ended during this turn (reward overlay appeared).
 */
async function playActiveTurn(page, turnIndex) {
	// Check if game is already over before we do anything
	const overlayAlready = await page.locator('#reward-overlay').isVisible({ timeout: 200 }).catch(() => false);
	if (overlayAlready) return false;

	// Attempt general quest if button is enabled
	const questBtn = page.locator('#btn-general-quest');
	const questEnabled = await questBtn.evaluate(el => !el.disabled).catch(() => false);
	if (questEnabled) {
		await questBtn.click();
		await page.waitForTimeout(400);

		// Stage 1: payment confirm
		const yesBtn = page.locator('#modal-yes');
		if (await yesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
			await yesBtn.click();
			await page.waitForTimeout(300);
		}
		// Stage 2: attempt preview
		const attemptBtn = page.locator('#modal-attempt');
		if (await attemptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await attemptBtn.click();
			await page.waitForTimeout(300);
		}
		// Stage 3: dice roll
		const rollBtn = page.locator('#modal-roll');
		if (await rollBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await rollBtn.click();
			await page.waitForTimeout(1600);
		}
		// Stage 4: continue
		const doneBtn = page.locator('#modal-done');
		if (await doneBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await doneBtn.click();
			await page.waitForTimeout(400);
		}
	}

	// Check if game ended during quest resolution
	const overlayAfterQuest = await page.locator('#reward-overlay').isVisible({ timeout: 200 }).catch(() => false);
	if (overlayAfterQuest) return false;

	// Play one piecie from hand if available
	const hand = await readHand(page);
	const piecie = hand.find(c => c.cardType === 'PIECIE');
	if (piecie) {
		const wrap = page.locator(`.hand-card-wrap[data-card-id="${piecie.cardId}"]`).first();
		await wrap.hover({ position: { x: 100, y: 30 } }); // hand is sunk: hover lifts the card and reveals its Play button
		await page.waitForTimeout(250);
		const playBtn = wrap.locator('.hand-card__play-btn');
		if (await playBtn.isVisible({ timeout: 300 }).catch(() => false)) {
			await playBtn.click();
			await page.waitForTimeout(500);
			// Auto-dismiss any target/confirm modal
			const targetBtn = page.locator('.target-option, .modal-mosje-select-btn:not(:disabled)').first();
			if (await targetBtn.isVisible({ timeout: 600 }).catch(() => false)) {
				await targetBtn.click();
				await page.waitForTimeout(300);
			}
		}
	}

	// Check if game ended during piecie play
	const overlayAfterPiecie = await page.locator('#reward-overlay').isVisible({ timeout: 200 }).catch(() => false);
	if (overlayAfterPiecie) return false;

	// End turn — wait for bot or game over
	await page.click('#btn-end-turn');

	// Race between bot finishing its turn and game over overlay
	const result = await Promise.race([
		page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 45000 }).then(() => 'turn'),
		page.waitForSelector('#reward-overlay', { timeout: 45000 }).then(() => 'gameover'),
	]).catch(() => 'timeout');

	if (result === 'gameover' || result === 'timeout') return false;

	await ss(page, `full-game-turn-${turnIndex}`);
	return true;
}

// ─── VIS-GAME-01: Passive game — PHYSICAL_FORCE vs ARTISTIC_RHYTHM ─────────

test('full game: passive — human ends turns until game over (PHYSICAL_FORCE)', async ({ page }) => {
	test.setTimeout(120000);

	await seedOfflineSession(page, 'PHYSICAL_FORCE', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await ss(page, 'full-game-passive-start');

	const startMosjes = await readOwnedMosjes(page);
	console.log('Starting Mosjes:', startMosjes);
	expect(startMosjes.length).toBeGreaterThan(0);

	let turnCount = 0;
	const maxTurns = 30;

	while (turnCount < maxTurns) {
		turnCount++;
		console.log(`Turn ${turnCount}...`);

		// End human turn immediately
		await page.click('#btn-end-turn');

		const result = await Promise.race([
			page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 45000 }).then(() => 'turn'),
			page.waitForSelector('#reward-overlay', { timeout: 45000 }).then(() => 'gameover'),
		]).catch(() => 'timeout');

		if (result === 'gameover') {
			console.log(`Game ended on turn ${turnCount}`);
			break;
		}
		if (result === 'timeout') {
			throw new Error(`Game timed out on turn ${turnCount} waiting for bot`);
		}
	}

	// Verify reward overlay appeared
	await page.waitForSelector('#reward-overlay', { timeout: 5000 });
	const { title, subtitle, reason } = await waitForGameOver(page, 5000);
	await ss(page, 'full-game-passive-end');

	// Assert game ended with a valid screen
	expect(title).toMatch(/Victory|Defeat/);
	expect(subtitle).toBeTruthy();

	// Assert win reason is one of the 4 valid conditions
	const reasonFound = WIN_REASONS.some(r => reason.toUpperCase().includes(r.replace(/_/g, " ")));
	console.log('Win reason found:', reasonFound, '|', subtitle);
	expect(reasonFound).toBe(true);

	// Assert log captured the game-over entry
	const log = await readLog(page);
	const logText = log.join(' ');
	expect(logText).toMatch(/wins!/i);

	// Assert turn count was reasonable (not stuck in infinite loop)
	console.log(`Completed in ${turnCount} turns`);
	expect(turnCount).toBeLessThanOrEqual(maxTurns);
	expect(turnCount).toBeGreaterThanOrEqual(1);
});

// ─── VIS-GAME-02: Active game — DIGITAL_CONTROL vs PHYSICAL_FORCE ────────────

test('full game: active — human plays quests + piecies each turn (DIGITAL_CONTROL)', async ({ page }) => {
	test.setTimeout(180000);

	// Mock dice to 0.5 so quest rolls are 4 (boundary success for most quests)
	await mockDiceRoll(page, 0.5);
	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'PHYSICAL_FORCE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await ss(page, 'full-game-active-start');

	const startMosjes = await readOwnedMosjes(page);
	console.log('Starting Mosjes:', startMosjes);

	let turnCount = 0;
	const maxTurns = 30;
	let gameEnded = false;

	while (turnCount < maxTurns && !gameEnded) {
		turnCount++;
		console.log(`Active turn ${turnCount}...`);
		const stillRunning = await playActiveTurn(page, turnCount);
		if (!stillRunning) {
			gameEnded = true;
			break;
		}
	}

	// If game didn't end naturally within maxTurns, we still need to check
	if (!gameEnded) {
		const overlayVisible = await page.locator('#reward-overlay').isVisible({ timeout: 2000 }).catch(() => false);
		if (!overlayVisible) {
			throw new Error(`Game did not end within ${maxTurns} turns`);
		}
	}

	await page.waitForSelector('#reward-overlay', { timeout: 10000 });
	const { title, subtitle, reason } = await waitForGameOver(page, 5000);
	await ss(page, 'full-game-active-end');

	// Core assertions
	expect(title).toMatch(/Victory|Defeat/);
	const reasonFound = WIN_REASONS.some(r => reason.toUpperCase().includes(r.replace(/_/g, " ")));
	expect(reasonFound).toBe(true);
	console.log(`Active game ended in ${turnCount} turns: ${subtitle}`);
});

// ─── VIS-GAME-03: All three decks — one passive game each ────────────────────

const DECK_MATCHUPS = [
	{ p1: 'PHYSICAL_FORCE',  p2: 'DIGITAL_CONTROL' },
	{ p1: 'DIGITAL_CONTROL', p2: 'ARTISTIC_RHYTHM' },
	{ p1: 'ARTISTIC_RHYTHM', p2: 'PHYSICAL_FORCE' },
];

for (const matchup of DECK_MATCHUPS) {
	test(`full game: ${matchup.p1} vs ${matchup.p2} — game completes without crash`, async ({ page }) => {
		test.setTimeout(120000);

		await seedOfflineSession(page, matchup.p1, matchup.p2);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);

		let turnCount = 0;

		while (turnCount < 30) {
			turnCount++;
			await page.click('#btn-end-turn');
			const result = await Promise.race([
				page.waitForSelector('#btn-end-turn:not([disabled])', { timeout: 45000 }).then(() => 'turn'),
				page.waitForSelector('#reward-overlay', { timeout: 45000 }).then(() => 'gameover'),
			]).catch(() => 'timeout');
			if (result === 'gameover' || result === 'timeout') break;
		}

		await page.waitForSelector('#reward-overlay', { timeout: 5000 });
		const { title, subtitle, reason } = await waitForGameOver(page, 5000);
		await ss(page, `full-game-${matchup.p1.toLowerCase()}-vs-${matchup.p2.toLowerCase()}`);

		expect(title).toMatch(/Victory|Defeat/);
		const reasonFound = WIN_REASONS.some(r => reason.toUpperCase().includes(r.replace(/_/g, " ")));
		expect(reasonFound).toBe(true);
		console.log(`${matchup.p1} vs ${matchup.p2}: ${subtitle} (${turnCount} turns)`);
	});
}

// ─── VIS-GAME-04: Accelerated game — force near-win, assert exact win reason ─

test('full game: LEVEL_3 win fires INSTANTLY when a quest tips a Mosje over — no end-turn needed', async ({ page }) => {
	// Regression guard for the "games go to Lvl 4 / no instant You-Won" bug
	// (2026-06-20). resolveQuest now calls checkVictory, so crossing into Level 3
	// declares the win in the SAME action — not deferred to the next end-of-turn.
	test.setTimeout(60000);

	// Guaranteed dice success (roll 6) so the quest always passes its threshold.
	await mockDiceRoll(page, 0.9999);
	await seedOfflineSession(page, 'PHYSICAL_FORCE', 'DIGITAL_CONTROL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Put the human's Mosje one quest away from winning: Level 2 / 90 MP.
	// After the 20 MP attempt cost (→70) a +60 quest reward crosses 100 → Level 3.
	const cardId = await page.evaluate(() => {
		const gs = window.__testHooks.getGameState();
		return gs.players.player_1.activeSlots[0]?.cardId;
	});
	await page.evaluate((cid) => {
		window.__testHooks.setMosjeOnField('player_1', 0, cid, { mp: 90, level: 2 });
		window.__testHooks.injectQuestToTopOfDeck('quest_arm_wrestling'); // +60 MP on success
	}, cardId);

	// Attempt the General Quest through the real UI flow.
	await page.click('#btn-general-quest');
	await page.waitForTimeout(400);
	for (const sel of ['#modal-yes', '#modal-attempt', '#modal-roll', '#modal-done']) {
		const btn = page.locator(sel);
		if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
			// The dice modal must show the attempting Mosje's stats (name + traits).
			if (sel === '#modal-roll') {
				await expect(page.locator('.dice-mosje-name')).toBeVisible();
				await ss(page, 'dice-modal-mosje-stats');
				const traitChips = await page.locator('.dice-mosje-trait').count();
				expect(traitChips).toBeGreaterThan(0);
			}
			await btn.click();
			await page.waitForTimeout(sel === '#modal-roll' ? 1600 : 400);
		}
	}

	// The win overlay must already be on screen — we have NOT clicked End Turn.
	await page.waitForSelector('#reward-overlay', { timeout: 5000 });
	const { title, reason } = await waitForGameOver(page, 3000);
	await ss(page, 'full-game-instant-level3-win');

	// Instant victory for the human, won by reaching Level 3.
	expect(title).toBe('Victory!');
	expect(reason.toUpperCase()).toContain('LEVEL 3');

	// The end screen embeds the battle log (colour-coded rows) + a Copy Log button.
	await expect(page.locator('#reward-overlay .reward-log')).toBeVisible();
	const logRows = await page.locator('#reward-overlay .reward-log .log-row').count();
	expect(logRows).toBeGreaterThan(3);
	await expect(page.locator('#reward-copy-btn')).toBeVisible();
	await ss(page, 'reward-overlay-battle-log');

	// And the Mosje is exactly Level 3 (never overshot to Level 4).
	const winnerLevel = await page.evaluate(() => {
		const gs = window.__testHooks.getGameState();
		return gs.players.player_1.activeSlots[0]?.level;
	});
	expect(winnerLevel).toBe(3);
});
