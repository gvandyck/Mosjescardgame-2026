/**
 * turn-flow-2-0.spec.js - Obby 2.0 setup, cooldown turn and summoning on the live board.
 * Covers handoff E11 (setup), E21 (cooldown turn), E2 (summon costs Energy).
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setEnergy, setHand, playCardFromHand,
	setMosjeOnField, clearEntryProtection, attackViaUi,
} from './helpers.js';
import { answerModals } from '../helpers/answerModals.js';
import { clickEndTurn } from '../helpers/clickEndTurn.js';

async function waitForHumanTurn(page, minTurn) {
	await page.waitForFunction((m) => {
		const gs = window.__testHooks?.getGameState();
		const btn = document.getElementById('btn-end-turn');
		return gs && gs.turnNumber >= m && gs.activePlayerId === 'player_1' && btn && btn.disabled === false;
	}, minTurn, { timeout: 40000 });
	await page.waitForTimeout(1500);
}

test('E11: setup - opponent starter fresh, 3 cards for first player, 3 Energy', async ({ page }) => {
	test.setTimeout(90000);
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	const gs = await getGameState(page);
	expect(gs.activePlayerId).toBe('player_1');
	for (const pid of ['player_1', 'player_2']) {
		const mosjes = gs.players[pid].activeSlots.filter(Boolean);
		expect(mosjes.length, `${pid} starts with 1 Mosje`).toBe(1);
	}
	// Fresh clears at the owner's turn start: the first player's starter already stood up,
	// the opponent's starter is still fresh (protected) until their first turn.
	expect(gs.players.player_1.activeSlots.find(Boolean).entryProtected).toBeFalsy();
	expect(gs.players.player_2.activeSlots.find(Boolean).entryProtected).toBe(true);
	expect(gs.players.player_1.hand.length, 'first player skips first draw (R5)').toBe(3);
	expect(gs.players.player_1.energy, '2 start + 1 turn start').toBe(3);
	expect(gs.players.player_1.piecieSlots.length).toBe(3);

	const deckBefore = gs.players.player_2.deck.length;
	await clickEndTurn(page);
	await waitForHumanTurn(page, 2);
	const after = await getGameState(page);
	// The bot spends cards on its turn, so check the draw by deck shrinkage: second player draws 1.
	expect(after.players.player_2.deck.length, 'second player drew exactly 1').toBe(deckBefore - 1);
});

test('E21: deck-out makes a cooldown turn (Piecie only) and the game does not hang', async ({ page }) => {
	test.setTimeout(120000);
	await seedOfflineSession(page, 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await answerModals(page, [], { max: 4, wait: 500 }); // a random starter (Coert, Martin) can open a blocking "Draw step" modal
	await setHand(page, 'player_1', []); // a random opening Snelle would open a reaction window the bot's turn then waits on
	await setHand(page, 'player_2', []);
	await page.evaluate(() => {
		window.__testHooks.setMosjeOnField('player_1', 0, 'mosje_binti', { mp: 95, level: 1 });
		window.__testHooks.emptyDeck('player_1');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
		window.__testHooks.injectGraveyardCard('player_1', 'piecie_affoe');
	});
	await clickEndTurn(page);
	await waitForHumanTurn(page, 2);

	const cd = await getGameState(page);
	expect(cd.players.player_1.cooldownTurn, 'cooldown turn after deck-out draw').toBe(true);
	expect(cd.players.player_1.skipNextTurn, 'V4 skip is gone').toBeUndefined();

	// A face-down Piecie can be placed; a Mosje summon is refused.
	await setEnergy(page, 'player_1', 6);
	await setHand(page, 'player_1', ['piecie_affoe', 'mosje_alyssa_fissa']);
	await playCardFromHand(page, 'piecie_affoe');
	await page.waitForTimeout(500);
	let gs = await getGameState(page);
	expect(gs.players.player_1.piecieSlots.filter(Boolean).length, 'Piecie placed on cooldown').toBe(1);
	await playCardFromHand(page, 'mosje_alyssa_fissa');
	await page.waitForTimeout(500);
	gs = await getGameState(page);
	expect(gs.players.player_1.activeSlots.filter(Boolean).length, 'summon refused on cooldown').toBe(1);
	expect(gs.players.player_1.energy, 'no Energy spent').toBe(6);
	await page.keyboard.press('Escape');
	const ok = page.locator('.modal-overlay button, #modal-root button').first();
	if (await ok.isVisible({ timeout: 500 }).catch(() => false)) await ok.click();

	// No hang: the turn passes and control comes back, cooldown cleared.
	const turnBefore = gs.turnNumber;
	await clickEndTurn(page);
	await waitForHumanTurn(page, turnBefore + 1);
	const next = await getGameState(page);
	expect(next.players.player_1.cooldownTurn).toBeFalsy();
});

test('E2: summoning a Mosje lowers Energy by its cost and arrives fresh', async ({ page }) => {
	test.setTimeout(60000);
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setEnergy(page, 'player_1', 5);
	await setHand(page, 'player_1', ['mosje_gandoe_wizard']); // cost 3
	await playCardFromHand(page, 'mosje_gandoe_wizard');
	await page.waitForTimeout(800);
	const gs = await getGameState(page);
	const mosjes = gs.players.player_1.activeSlots.filter(Boolean);
	expect(mosjes.length).toBe(2);
	expect(gs.players.player_1.energy).toBe(2);
	const summoned = mosjes.find(s => s.cardId === 'mosje_gandoe_wizard');
	expect(summoned?.entryProtected, 'summoned Mosje is fresh').toBe(true);
});

test('U11: End Turn shows how many Mosjes can still act and only asks to confirm while one can', async ({ page }) => {
	test.setTimeout(120000);
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await answerModals(page, [], { max: 4, wait: 500 });
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_gandoe_destroyer', { mp: 50, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_ming_predictor', { mp: 90, level: 1 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
	const endTurn = page.locator('#btn-end-turn');
	const confirmRows = page.locator('.modal-card--reaction .modal-mosje-select-btn');

	// Two Mosjes can still attack or Quest: the hint says so and the button carries the count.
	await expect(endTurn).toHaveAttribute('data-actions-left', '2');
	await expect(endTurn.locator('.end-turn__hint')).toHaveText('2 actions left');
	await expect(endTurn.locator('.end-turn__label')).toHaveText('End Turn');

	// Tapping End Turn asks first: two big rows, no cancel; Keep playing leaves everything as it was.
	await endTurn.click();
	await expect(page.locator('.modal-card--reaction h3')).toHaveText('End turn?');
	await expect(page.locator('.modal-card--reaction p')).toHaveText('A Mosje can still act: end turn anyway?');
	await expect(confirmRows).toHaveText(['End turn', 'Keep playing']);
	await expect(page.locator('#modal-option-cancel'), 'no cancel button').toHaveCount(0);
	await page.waitForTimeout(500); // the modal's pop-in scale settles before the rows are measured
	for (const row of await confirmRows.all()) expect((await row.boundingBox()).height, 'rows are at least 56 px high').toBeGreaterThanOrEqual(56);
	fs.mkdirSync('tests/ui/screenshots/board-2-0', { recursive: true });
	await page.screenshot({ path: 'tests/ui/screenshots/board-2-0/u11-endturn-confirm.png' });
	await page.locator('.modal-mosje-select-btn[data-id="keep"]').click();
	await expect(page.locator('.modal-card')).toHaveCount(0);
	let gs = await getGameState(page);
	expect(gs.activePlayerId, 'Keep playing: still my turn').toBe('player_1');
	expect(gs.turnNumber).toBe(1);

	// One Mosje attacks: one action left, singular hint.
	await attackViaUi(page, { slot: 0, target: 'player_2:0' });
	await expect(endTurn).toHaveAttribute('data-actions-left', '1');
	await expect(endTurn.locator('.end-turn__hint')).toHaveText('1 action left');

	// The second attacks: nothing left, no hint, and End Turn ends the turn at once (no confirm).
	await attackViaUi(page, { slot: 1, target: 'player_2:0' });
	await expect(endTurn).toHaveAttribute('data-actions-left', '0');
	await expect(endTurn.locator('.end-turn__hint')).toHaveCount(0);
	await endTurn.click();
	await page.waitForFunction(() => window.__testHooks.getGameState().turnNumber >= 2, null, { timeout: 15000 });
	await expect(page.locator('.modal-card--reaction'), 'no confirm when nothing can act').toHaveCount(0);

	// The bot's turn: End Turn is disabled and shows no hint; control comes back and the count is back too.
	await waitForHumanTurn(page, 2);
	gs = await getGameState(page);
	expect(gs.activePlayerId).toBe('player_1');
	await expect(endTurn).not.toHaveAttribute('data-actions-left', '0');
});
