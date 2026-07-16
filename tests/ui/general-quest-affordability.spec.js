/**
 * general-quest-affordability.spec.js — GATE-01/02/03 (Phase 37).
 *
 * D-06 repro (Michelle Phase-36-UAT knockout): a player with exactly ONE active
 * Mosje could attempt a 20-MP General Quest even when that Mosje had < 20 MP —
 * src/main.js:1525-1528's `else` branch bypassed the showMosjeSelect picker and
 * called showQuestPreviewThenRoll directly, charging 20 MP unconditionally and
 * driving the Mosje below 0 (lethal at Level 0, per docs/phase0-rulings.md:126).
 *
 * Per CLAUDE.md's reproduce-first rule: Test A below is written to FAIL on the
 * pre-fix code (make-it-fail-first) — proving the self-destruct live in a real
 * browser — before any fix is applied. It must pass only after the single-Mosje
 * General-Quest path is routed through showMosjeSelect (D-02's disabled-picker
 * convention, D-03's `mp >= 20` threshold).
 *
 * Test B proves the gate does not block an affordable attempt (D-03).
 * Test C (GATE-02, D-05) is a regression guard for the already-correct
 * Personal-Quest single-Mosje picker — no production code change for this case.
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST,
	seedOfflineSession,
	waitForBoard,
	setMosjeOnField,
	setHand,
	unlockPiecies,
	clearEntryProtection,
	playCardFromHand,
	getGameState,
	endTurnAndWait,
	ss,
} from './helpers.js';

/** Put a specific quest at the top of the shared General Quest deck. */
async function injectQuestToTopOfDeck(page, questId) {
	await page.evaluate((id) => {
		window.__testHooks?.injectQuestToTopOfDeck(id);
	}, questId);
}

/** Click #btn-general-quest and confirm the "Pay 20 MP to attempt?" intent dialog. */
async function startGeneralQuestAttempt(page) {
	await page.click('#btn-general-quest');
	const yesBtn = page.locator('#modal-yes');
	await yesBtn.waitFor({ state: 'visible', timeout: 5000 });
	await yesBtn.click();
	await page.waitForTimeout(500);
}

test('unaffordable single Mosje — attempt blocked, MP unchanged, not defeated', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	// U2 first-turn-lock: the game's literal P1 cannot attempt a General Quest on
	// turn 1 — advance to turn 2 first so only affordability is exercised.
	await endTurnAndWait(page);

	// Single own Mosje below the 20 MP fee — the Michelle knockout repro (Phase 36 UAT).
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 10, level: 0 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await clearEntryProtection(page);
	await injectQuestToTopOfDeck(page, 'quest_leap_of_faith');

	await startGeneralQuestAttempt(page);
	await ss(page, 'general-quest-affordability-unaffordable');

	// Make-it-fail-first proof (D-06): on the pre-fix code, the else-branch
	// bypasses the picker and charges 20 MP immediately, driving Michelle to
	// -10 MP → defeated at Level 0. After the fix, the sole Mosje renders as a
	// disabled picker option instead and NO charge ever happens.
	const state = await getGameState(page);
	const slot = state.players.player_1.activeSlots[0];
	expect(slot.mp).toBe(10);
	expect(slot.isDefeated).toBeFalsy();
});

test('affordable single Mosje — 20 MP charged, attempt proceeds', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	// U2 first-turn-lock: advance to turn 2 first (see Test A comment).
	await endTurnAndWait(page);

	// Single own Mosje that CAN afford the 20 MP fee.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await clearEntryProtection(page);
	await injectQuestToTopOfDeck(page, 'quest_leap_of_faith');

	await startGeneralQuestAttempt(page);

	// Post-fix: the single-Mosje picker always shows (showMosjeSelect); the sole
	// option is enabled (mp >= 20) — select it to proceed. Pre-fix: no picker
	// appears at all (the else-branch already charged the fee directly).
	const enabledOption = page.locator('.modal-mosje-select-btn:not([disabled])').first();
	if (await enabledOption.isVisible({ timeout: 2000 }).catch(() => false)) {
		await enabledOption.click();
		await page.waitForTimeout(500);
	}

	const state = await getGameState(page);
	// 40 - 20 QUEST_COST, charged before the dice roll resolves.
	expect(state.players.player_1.activeSlots[0].mp).toBe(20);
});

test('Personal Quest — unaffordable single Mosje: picker disables, no charge (D-05 regression)', async ({ page }) => {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Single own Mosje eligible for Kickboxing Bootcamp (Michelle), below 20 MP.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_michelle', { mp: 10, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await clearEntryProtection(page);

	await setHand(page, 'player_1', ['quest_personal_kickboxing_bootcamp']);
	await playCardFromHand(page, 'quest_personal_kickboxing_bootcamp');
	await unlockPiecies(page, 'player_1');

	const activateBtn = page.locator('#piecies-player [data-card-id="quest_personal_kickboxing_bootcamp"] button').first();
	await activateBtn.waitFor({ timeout: 5000 });
	await activateBtn.click();
	await page.waitForTimeout(500);
	await ss(page, 'personal-quest-affordability-unaffordable');

	// D-05: already-correct behavior — the sole (unaffordable) Mosje renders
	// as a disabled picker option; no MP is charged, no defeat occurs.
	const disabledOptions = page.locator('.modal-mosje-select-btn[disabled]');
	await expect(disabledOptions).toHaveCount(1);

	const state = await getGameState(page);
	const slot = state.players.player_1.activeSlots[0];
	expect(slot.mp).toBe(10);
	expect(slot.isDefeated).toBeFalsy();
});
