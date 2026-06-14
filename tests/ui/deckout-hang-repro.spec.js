/**
 * deckout-hang-repro.spec.js — Reproduces the deck-out turn-skip freeze in a REAL browser.
 *
 * Mirrors the reported game: Binti The Sharp Tongue (DIGITAL_CONTROL, human/player_1)
 * vs Dancing/DDR Chris (ARTISTIC_RHYTHM, bot/player_2), offline single-player.
 *
 * The freeze: when the human decks out (D-06 sets skipNextTurn), the human's next
 * startTurn was skipped and control bounced back to the bot — but the offline UI
 * re-enabled End Turn and handed back to the human. It was then the bot's turn with
 * nothing driving it, and every human action was rejected as "not your turn". Frozen.
 *
 * This test forces the deck-out, plays through the skipped turn, and asserts control
 * returns to the human. Before the fix this hangs (the assertion below times out);
 * after the fix the bot auto-takes the skipped turn and control comes back.
 */

import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST, ss } from './helpers.js';

const getState = (page) => page.evaluate(() => window.__testHooks?.getGameState() ?? null);

async function waitForHumanControl(page, timeout) {
	// Control is genuinely back with the human only when BOTH: it's player_1's turn
	// AND the End Turn button is enabled. (Pre-fix the button re-enabled while it was
	// still the bot's turn — so we must check activePlayerId too, not just the button.)
	await page.waitForFunction(() => {
		const gs = window.__testHooks?.getGameState();
		const btn = document.getElementById('btn-end-turn');
		return gs && gs.activePlayerId === 'player_1' && btn && btn.disabled === false;
	}, null, { timeout });
}

test('deck-out turn-skip does not freeze offline play (Binti vs DDR Chris)', async ({ page }) => {
	test.setTimeout(90000);

	// Same matchup as the bug report.
	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	const opening = await getState(page);
	expect(opening.activePlayerId).toBe('player_1');

	// Match the reported board exactly: Binti (human) vs DDR Chris (bot). Both decks
	// contain these Mosjes; here we field them directly. Binti gets a healthy MP buffer
	// so the bot can't KO her before we reach the skip.
	await page.evaluate(() => {
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_binti', { mp: 95, level: 0 });
		window.__testHooks.setMosjeOnField('player_2', 0, 'mosje_chris_ddr', { mp: 50, level: 0 });
	});
	const board = await getState(page);
	expect(board.players.player_1.activeSlots[0].cardId).toBe('mosje_binti');
	expect(board.players.player_2.activeSlots[0].cardId).toBe('mosje_chris_ddr');

	// Arm the deck-out: empty the human's deck and seed the discard so the next draw
	// phase reshuffles (which is what sets skipNextTurn).
	await page.evaluate(() => {
		window.__testHooks.emptyDeck('player_1');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
	});

	// Turn 1 → End Turn. Bot plays turn 1, then the human's turn 2 begins: deck-out
	// reshuffle fires and arms skipNextTurn for the human's FOLLOWING turn.
	await page.click('#btn-end-turn');
	await waitForHumanControl(page, 30000);

	const armed = await getState(page);
	expect(armed.players.player_1.skipNextTurn).toBe(true); // deck-out penalty armed

	// Turn 2 → End Turn. This is the critical transition: bot plays turn 2, then the
	// human's turn 3 is SKIPPED. The bot must auto-take that turn and hand back control.
	const turnBefore = armed.turnNumber;
	await page.click('#btn-end-turn');

	// THE ASSERTION THAT FREEZES PRE-FIX: control must return to the human.
	await waitForHumanControl(page, 30000);

	const after = await getState(page);
	expect(after.activePlayerId).toBe('player_1');          // human is active again
	expect(after.players.player_1.skipNextTurn).toBe(false); // skip was consumed
	expect(after.turnNumber).toBeGreaterThan(turnBefore);    // play advanced past the skip

	await ss(page, 'deckout-hang-repro-recovered');
});
