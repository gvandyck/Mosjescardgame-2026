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
 *   1. Passive game   — human just ends every turn, bot drives to KNOCKOUT/PERSONAL_QUEST
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
	mockDiceRoll, questFirstAvailable, questViaUi,
} from './helpers.js';
import { clickEndTurn } from '../helpers/clickEndTurn.js';

// 63-08: a human in a long game meets blocking modals the old spec never answered: a bot attack opens the "Reaction" prompt
// (it waits for the human, so the bot's turn never ends), a starter's Draw step opens a modal at the turn start, and a turn-start
// ability can ask a "Choose" question (a deck search). Each is answered the way a player would ("No reaction", "Draw normally",
// else the first enabled option), like endTurnAndWait in helpers.js and the first-option clicking of questFirstAvailable.
async function dismissBlockers(page) {
	const noReaction = page.locator('.modal-card--reaction .modal-mosje-select-btn[data-id="__pass__"]');
	const drawStep = page.locator('.modal-mosje-select-btn[data-id="draw"]');
	const anyChoice = page.locator('.modal-mosje-select-btn:not([disabled])');
	// A card that shows the human the opponent's hand opens a read-only list with Close; a tile tap outside the own turn opens the detail view.
	const closeReveal = page.locator('#modal-close-hand-reveal');
	const closeDetail = page.locator('.card-detail button:has-text("Close")');
	for (const option of [noReaction, drawStep, closeReveal, closeDetail, anyChoice]) {
		if (await option.first().isVisible().catch(() => false)) { await option.first().click({ timeout: 2000 }).catch(() => {}); return true; }
	}
	return false;
}

/** End the human turn and wait for control back ('turn') or the end screen ('gameover'); 'timeout' after `ms` with neither. */
async function endTurnAndWatch(page, ms = 45000) {
	// A turn-start modal can open just after the End Turn button came back, so a blocked click is answered and retried.
	for (let attempt = 0; ; attempt++) {
		while (await dismissBlockers(page)) await page.waitForTimeout(200);
		try { await clickEndTurn(page, { timeout: 2500 }); break; } catch (err) { if (attempt >= 10) throw err; }
	}
	// Right after the click the button is still enabled for a moment: wait until the turn has really passed (button disabled) or the game is over.
	await page.waitForFunction(() => document.getElementById('reward-overlay') || document.getElementById('btn-end-turn')?.disabled === true, null, { timeout: 5000 }).catch(() => {});
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		if (await page.locator('#reward-overlay').count()) return 'gameover';
		if (await dismissBlockers(page)) { await page.waitForTimeout(200); continue; }
		// Control is back only when the button is enabled AND the engine says it is the human's turn with no reaction open: the
		// button can be enabled for a moment during the bot's turn (after a Reaction prompt), and a tile tap then opens the detail view.
		const mine = await page.evaluate(() => {
			const gs = window.__testHooks?.getGameState();
			return !!gs && gs.activePlayerId === 'player_1' && !gs.pendingReaction && document.getElementById('btn-end-turn')?.disabled === false;
		});
		if (mine) return 'turn';
		await page.waitForTimeout(150);
	}
	return 'timeout';
}

// Valid win reasons the overlay must show
// 2.0 overlay texts: "<Name> was knocked out: no Mosje left outside the pile" (knockout) and "<Player> completed <Quest> with <Mosje>".
const WIN_REASON_TEXT = /was knocked out|completed .+ with/i;
// 73: the games run on the three starter decks (the decks a player gets); a passive human is knocked out, which can take
// more than 30 turns now that the bot also builds towards its Personal Quest.
const MAX_TURNS = 60;
// The three matchup games: the Digital bot needed 59 and then more than 60 turns to knock out a passive Physical player (24 Nov).
const MAX_TURNS_MATCHUP = 110;

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

	// Attempt a Quest with the first Mosje that can act (2.0 tap flow: tap the Mosje, Quest, the Quest tile, click through);
	// questFirstAvailable does nothing and returns false when no Mosje's Quest chip is enabled (was: the old Quest button being disabled).
	try {
		await questFirstAvailable(page);
	} catch (err) {
		// What the game thought at that moment, so a failure names its cause (whose turn, a pending choice, the button).
		const snap = await page.evaluate(() => {
			const gs = window.__testHooks?.getGameState();
			const btn = document.getElementById('btn-end-turn');
			return { active: gs?.activePlayerId, turn: gs?.turnNumber, status: gs?.status, pendingChoice: gs?.pendingChoice?.kind ?? gs?.pendingChoice?.type ?? !!gs?.pendingChoice, pendingReaction: !!gs?.pendingReaction, endTurnDisabled: btn?.disabled, label: document.getElementById('turn-label')?.textContent, modal: document.querySelector('#modal-root .modal-card h3, #modal-root .modal-card h2')?.textContent ?? null };
		});
		throw new Error(`${err.message}
Game at that moment: ${JSON.stringify(snap)}`);
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

	// End turn — wait for the bot to finish its turn (answering its Reaction prompts) or for the game over overlay
	const result = await endTurnAndWatch(page);

	if (result === 'gameover' || result === 'timeout') return false;

	await ss(page, `full-game-turn-${turnIndex}`);
	return true;
}

// ─── VIS-GAME-01: Passive game — PHYSICAL_FORCE vs ARTISTIC_RHYTHM ─────────

test('full game: passive — human ends turns until game over (STARTER_PHYSICAL)', async ({ page }) => {
	test.setTimeout(300000);

	await seedOfflineSession(page, 'STARTER_PHYSICAL', 'STARTER_CREATIVE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await ss(page, 'full-game-passive-start');

	const startMosjes = await readOwnedMosjes(page);
	console.log('Starting Mosjes:', startMosjes);
	expect(startMosjes.length).toBeGreaterThan(0);

	let turnCount = 0;
	const maxTurns = MAX_TURNS;

	while (turnCount < maxTurns) {
		turnCount++;
		console.log(`Turn ${turnCount}...`);

		// End human turn immediately
		const result = await endTurnAndWatch(page);

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
	const reasonFound = WIN_REASON_TEXT.test(reason);
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

test('full game: active — human plays quests + piecies each turn (STARTER_DIGITAL)', async ({ page }) => {
	test.setTimeout(300000);

	// Mock dice to 0.5 so quest rolls are 4 (boundary success for most quests)
	await mockDiceRoll(page, 0.5);
	await seedOfflineSession(page, 'STARTER_DIGITAL', 'STARTER_PHYSICAL');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await ss(page, 'full-game-active-start');

	const startMosjes = await readOwnedMosjes(page);
	console.log('Starting Mosjes:', startMosjes);

	let turnCount = 0;
	const maxTurns = MAX_TURNS;
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
	const reasonFound = WIN_REASON_TEXT.test(reason);
	expect(reasonFound).toBe(true);
	console.log(`Active game ended in ${turnCount} turns: ${subtitle}`);
});

// ─── VIS-GAME-03: All three decks — one passive game each ────────────────────

const DECK_MATCHUPS = [
	{ p1: 'STARTER_PHYSICAL', p2: 'STARTER_DIGITAL' },
	{ p1: 'STARTER_DIGITAL', p2: 'STARTER_CREATIVE' },
	{ p1: 'STARTER_CREATIVE', p2: 'STARTER_PHYSICAL' },
];

for (const matchup of DECK_MATCHUPS) {
	test(`full game: ${matchup.p1} vs ${matchup.p2} — game completes without crash`, async ({ page }) => {
		test.setTimeout(480000);

		await seedOfflineSession(page, matchup.p1, matchup.p2);
		await page.goto(GAME_URL_TEST);
		await waitForBoard(page);

		let turnCount = 0;

		while (turnCount < MAX_TURNS_MATCHUP) {
			turnCount++;
			const result = await endTurnAndWatch(page);
			if (result === 'timeout') throw new Error(`Game timed out on turn ${turnCount} waiting for bot`);
			if (result === 'gameover') break;
		}

		await page.waitForSelector('#reward-overlay', { timeout: 5000 });
		const { title, subtitle, reason } = await waitForGameOver(page, 5000);
		await ss(page, `full-game-${matchup.p1.toLowerCase()}-vs-${matchup.p2.toLowerCase()}`);

		expect(title).toMatch(/Victory|Defeat/);
		const reasonFound = WIN_REASON_TEXT.test(reason);
		expect(reasonFound).toBe(true);
		console.log(`${matchup.p1} vs ${matchup.p2}: ${subtitle} (${turnCount} turns)`);
	});
}

// ─── VIS-GAME-04: Accelerated game — force near-win, assert exact win reason ─

test('full game: reaching Level 3 and holding it is NOT a win - a Level 3 Mosje wins with a Personal Quest', async ({ page }) => {
	// Obby 2.1 (D-01): the hold-Level-3 win is gone. A quest that lifts a Mosje to Level 3 shows no win, a whole round later it is
	// still no win, and the same Mosje then completes a Personal Quest from the hand and wins.
	test.setTimeout(300000);

	await seedOfflineSession(page, 'EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Put the human's Mosje one quest away from Level 3: Level 2 / 90 MP, a winning quest pushes it past 100.
	await page.evaluate(() => {
		// Both hands empty: a random opening Snelle rerolls or adds a die in the forced Quest rolls below.
		window.__testHooks.setHand('player_1', []);
		window.__testHooks.setHand('player_2', []);
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_gandoe_destroyer', { mp: 90, level: 2 }); // no quest-success ability
		window.__testHooks.setQuestFaceUp('PHYSICAL', 'quest_tough_it_out'); // Steady win +25 MP (>= 10 needed for Level 3)
		window.__testHooks.setNextDice([6, 6, 6]); // guaranteed success
		window.__testHooks.setTurnNumber(3);
	});
	await questViaUi(page, { slot: 0, stackId: 'PHYSICAL' });

	// Reached Level 3 this turn: NO win overlay.
	await page.waitForTimeout(800);
	const lvlNow = await page.evaluate(() => window.__testHooks.getGameState().players.player_1.activeSlots[0]?.level);
	expect(lvlNow).toBe(3);
	expect(await page.locator('#reward-overlay').count()).toBe(0);
	await ss(page, 'full-game-level3-no-instant-win');

	// Shield the Level 3 Mosje from the bot's random plays, end the turn, let the bot play: holding Level 3 into the owner's next
	// turn wins nothing any more.
	await page.evaluate(() => {
		const sl = window.__testHooks.getGameState().players.player_1.activeSlots[0];
		window.__testHooks.setMosjeOnField('player_1', 0, sl.cardId, { mp: sl.mp, level: sl.level, entryProtected: true });
	});
	await endTurnAndWait(page);
	expect(await page.locator('#reward-overlay').count()).toBe(0);
	expect(await page.evaluate(() => window.__testHooks.getGameState().status)).toBe('PLAYING');

	// Now a Personal Quest: the Mosje started this turn at Level 3, so it may attempt (2 dice, both 4+).
	const mosjeId = await page.evaluate(() => window.__testHooks.getGameState().players.player_1.activeSlots[0].cardId);
	expect(mosjeId).toBe('mosje_gandoe_destroyer');
	await page.evaluate(() => {
		window.__testHooks.setHand('player_1', ['pq_charge']);
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 3 });
		window.__testHooks.clearEntryProtection();
		window.__testHooks.setNextDice([6, 6, 6, 6]);
	});
	await playCardFromHand(page, 'pq_charge');
	await page.locator('.modal-mosje-select-btn[data-id="0"]').click({ timeout: 5000 });
	await page.locator('.modal-mosje-select-btn[data-id="ok"]').click({ timeout: 5000 });
	await page.waitForSelector('#reward-overlay', { timeout: 15000 });
	const { title, reason } = await waitForGameOver(page, 3000);
	await ss(page, 'full-game-personal-quest-win');
	expect(title).toBe('Victory!');
	expect(reason.toLowerCase()).toContain('completed charge! with'); // 72-14 sentence

	// The end screen embeds the battle log (colour-coded rows) + a Copy Log button.
	await page.locator('#reward-overlay .reward-log-summary').click(); // log is a collapsed <details>
	await expect(page.locator('#reward-overlay .reward-log')).toBeVisible();
	const logRows = await page.locator('#reward-overlay .reward-log .log-row').count();
	expect(logRows).toBeGreaterThan(3);
	await expect(page.locator('#reward-copy-btn')).toBeVisible();
	await ss(page, 'reward-overlay-battle-log');
});
