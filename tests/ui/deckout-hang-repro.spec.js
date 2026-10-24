/**
 * deckout-hang-repro.spec.js - Deck-out must never freeze offline play (Binti vs DDR Chris).
 *
 * Obby 2.0 (RULE-07): drawing from an empty deck reshuffles the discard and makes that
 * player's turn a COOLDOWN turn (only face-down Piecies). The original V4 freeze was a
 * skipped human turn the bot never drove; this guards the 2.0 equivalent: after the
 * cooldown turn control must come back to the human, who can act again.
 */

import { test, expect } from '@playwright/test';
import { seedOfflineSession, waitForBoard, GAME_URL_TEST, ss, setHand } from './helpers.js';
import { answerModals } from '../helpers/answerModals.js';
import { clickEndTurn } from '../helpers/clickEndTurn.js';

const getState = (page) => page.evaluate(() => window.__testHooks?.getGameState() ?? null);

async function waitForHumanControl(page, timeout, minTurn = 0) {
	// minTurn guards a headless race: right after End Turn the button is still enabled for a moment.
	// Control is genuinely back with the human only when BOTH: it's player_1's turn
	// AND the End Turn button is enabled. (Pre-fix the button re-enabled while it was
	// still the bot's turn — so we must check activePlayerId too, not just the button.)
	await page.waitForFunction((minTurn) => {
		const gs = window.__testHooks?.getGameState();
		const btn = document.getElementById('btn-end-turn');
		return gs && gs.turnNumber >= minTurn && gs.activePlayerId === 'player_1' && btn && btn.disabled === false;
	}, minTurn, { timeout });
	// Settle: the bot's last step ends its turn a moment BEFORE the human's startTurn runs
	// (draw / deck-out). Let that finish, then confirm control is still the human's.
	await page.waitForTimeout(1500);
	await page.waitForFunction((m) => {
		const gs = window.__testHooks?.getGameState();
		const btn = document.getElementById('btn-end-turn');
		return gs && gs.turnNumber >= m && gs.activePlayerId === 'player_1' && btn && btn.disabled === false;
	}, minTurn, { timeout });
}

test('deck-out cooldown turn does not freeze offline play (Binti vs DDR Chris)', async ({ page }) => {
	test.setTimeout(90000);

	// Same matchup as the bug report.
	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await answerModals(page, [], { max: 4, wait: 500 }); // a random starter (Coert, Martin) can open a blocking "Draw step" modal
	await setHand(page, 'player_1', []); // a random opening Snelle would open a reaction window the bot's turn then waits on
	await setHand(page, 'player_2', []);

	const opening = await getState(page);
	expect(opening.activePlayerId).toBe('player_1');

	// Match the reported board exactly: Binti (human) vs DDR Chris (bot). Both decks
	// contain these Mosjes; here we field them directly. Binti gets a healthy MP buffer
	// so the bot can't KO her before we reach the skip.
	await page.evaluate(() => {
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_binti', { mp: 95, level: 1 });
		window.__testHooks.setMosjeOnField('player_2', 0, 'mosje_chris_ddr', { mp: 50, level: 1 });
	});
	const board = await getState(page);
	expect(board.players.player_1.activeSlots[0].cardId).toBe('mosje_binti');
	expect(board.players.player_2.activeSlots[0].cardId).toBe('mosje_chris_ddr');

	// Arm the deck-out: empty the human's deck and seed the discard so the next draw
	// phase reshuffles (which sets cooldownTurn).
	await page.evaluate(() => {
		window.__testHooks.emptyDeck('player_1');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
	});

	// Turn 1 → End Turn. Bot plays, then the human's next turn begins: the empty-deck draw
	// reshuffles the discard and makes this turn a cooldown turn.
	await clickEndTurn(page);
	await waitForHumanControl(page, 30000, 2);

	const armed = await getState(page);
	expect(armed.players.player_1.cooldownTurn).toBe(true); // 2.0 cooldown turn (no skip)
	expect(armed.players.player_1.skipNextTurn).toBeUndefined(); // V4 skip is gone

	// End the cooldown turn: the bot plays and control MUST return to the human.
	const turnBefore = armed.turnNumber;
	await clickEndTurn(page);
	await waitForHumanControl(page, 30000, turnBefore + 1);

	const after = await getState(page);
	expect(after.activePlayerId).toBe('player_1');            // human is active again
	expect(after.players.player_1.cooldownTurn).toBeFalsy();  // cooldown ended with the turn
	expect(after.turnNumber).toBeGreaterThan(turnBefore);      // play advanced

	await ss(page, 'deckout-hang-repro-recovered');
});
