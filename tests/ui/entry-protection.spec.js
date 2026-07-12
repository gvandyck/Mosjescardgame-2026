/**
 * entry-protection.spec.js — Fresh-Mosje entry protection (phase0-rulings U8).
 *
 * Repro of the turn-1 kill: duo starters with startMP 0 (Gandoe, Michelle,
 * Youri, Jisca…) could be defeated by any chip damage (e.g. Binti's Cutting
 * Words, -10 MP) before their owner ever had a turn — an instant KNOCKOUT
 * on turn 1. The rule fix: a Mosje that enters play is protected from
 * opponent effects until its owner's next turn starts.
 *
 * This spec MUST fail on pre-protection code (opponent starter dies, game
 * ends turn 1) and pass once entry protection is in the engine.
 *
 * Run: npx playwright test tests/ui/entry-protection.spec.js --project=visual
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, ss,
	setMosjeOnField, getGameState,
} from './helpers.js';

test('turn-1: opponent starting Mosje at 0 MP survives Binti Cutting Words', async ({ page }) => {
	test.setTimeout(60000);

	// Real game start: CB (us) vs GM (bot). GM's starter (Gandoe or Michelle)
	// enters at startMP 0 — the exact turn-1 kill victim.
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// The CB starter pick is random (Binti or Coert) — force Binti on our side.
	// Our own slot's protection is irrelevant here; we are the attacker.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 30 });

	const before = await getGameState(page);
	const oppBefore = (before.players.player_2.activeSlots || []).find(s => s && !s.isDefeated);
	expect(oppBefore, 'opponent must have a starting Mosje on field').toBeTruthy();
	expect(oppBefore.mp, 'GM starters enter at 0 MP').toBe(0);

	// The opponent has NOT had a turn yet — their starter must carry entry
	// protection. (Fails on pre-protection code: the flag does not exist.)
	expect(oppBefore.entryProtected, 'starter is protected before owner had a turn').toBe(true);

	// Try the turn-1 snipe: Binti's Cutting Words (-10 MP → below 0 → defeat).
	await page.locator('.mosje-card--owned[data-card-id="mosje_binti"] .mosje-ability-btn').click();

	// Pre-fix: a discard picker opens and the kill goes through.
	// Post-fix: the UI blocks the ability (protected target) — no picker.
	const discardOption = page.locator('.modal-card-option').first();
	if (await discardOption.isVisible({ timeout: 1500 }).catch(() => false)) {
		await discardOption.click();
	}
	await page.waitForTimeout(800);
	await ss(page, 'entry-protection-binti-turn1');

	const after = await getGameState(page);
	const oppAfter = (after.players.player_2.activeSlots || [])
		.find(s => s && s.cardId === oppBefore.cardId);
	expect(oppAfter, 'opponent starter still on field').toBeTruthy();
	expect(oppAfter.isDefeated ?? false, 'protected starter must not be defeated').toBe(false);
	expect(after.status, 'no turn-1 knockout').not.toBe('FINISHED');
	const overlayVisible = await page.locator('#reward-overlay').isVisible().catch(() => false);
	expect(overlayVisible, 'no victory overlay on turn 1').toBe(false);
});
