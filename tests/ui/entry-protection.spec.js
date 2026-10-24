/**
 * entry-protection.spec.js — Fresh-Mosje entry protection (phase0-rulings U8; 2.0 rule: a Fresh Mosje cannot be chosen
 * by opponent cards or attacked until its owner's next turn starts).
 *
 * Repro of the turn-1 snipe: the opponent's starting Mosje (2.0: enters at its printed Start MP, 10 for Gandoe the Wizard
 * and Michelle, 0 for Gandoe the Destroyer) must not be hit by chip damage (e.g. Binti's Cutting Words, -10 MP) before its
 * owner ever had a turn. The rule fix: a Mosje that enters play is protected from opponent effects until its owner's next
 * turn starts.
 *
 * This spec MUST fail on pre-protection code (the opponent starter is hit) and pass once entry protection is in the engine.
 * 63-06: Cutting Words is used from the Mosje's action tray (tap Binti, Ability), not from a tile button.
 *
 * Run: npx playwright test tests/ui/entry-protection.spec.js --project=visual
 */

import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, ss,
	setMosjeOnField, getGameState, setHand, setEnergy,
} from './helpers.js';
import { abilityByTap } from '../helpers/boardTaps.js';
import { answerModals } from '../helpers/answerModals.js';
import { MOSJES } from '../../src/data/mosjes.js';

test('turn-1: opponent starting Mosje is untouchable and survives Binti Cutting Words', async ({ page }) => {
	test.setTimeout(60000);

	// Real game start: CB (us) vs GM (bot). GM's starter (random, Gandoe or Michelle's deck)
	// enters at its printed 2.0 Start MP and is Fresh: the turn-1 snipe victim.
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// The CB starter pick is random (Binti or Coert) — force Binti on our side.
	// Our own slot's protection is irrelevant here; we are the attacker.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 30 });
	// Cutting Words costs 1 Energy and a Piecie from the hand (Card List 2.0): give Binti both, so the ONLY thing that can
	// stop the hit is the protection.
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);
	await setEnergy(page, 'player_1', 3);

	const before = await getGameState(page);
	const oppBefore = (before.players.player_2.activeSlots || []).find(s => s && !s.isDefeated);
	expect(oppBefore, 'opponent must have a starting Mosje on field').toBeTruthy();
	const printedStartMp = MOSJES.find(m => m.id === oppBefore.cardId).startMP;
	expect(oppBefore.mp, 'a 2.0 starter enters at its printed Start MP').toBe(printedStartMp);

	// The opponent has NOT had a turn yet — their starter must carry entry
	// protection. (Fails on pre-protection code: the flag does not exist.)
	expect(oppBefore.entryProtected, 'starter is protected before owner had a turn').toBe(true);

	// Try the turn-1 snipe: Binti's Cutting Words (-10 MP) from her tray. Pre-fix: the opponent picker lists the fresh
	// starter and the hit goes through. Post-fix: the protected Mosje is not offered (no target picker), nothing happens.
	await abilityByTap(page, 'mosje_binti');
	await answerModals(page, [], { max: 3, wait: 800 }); // the Piecie-to-discard picker, if the flow gets that far
	await page.waitForTimeout(800);
	await ss(page, 'entry-protection-binti-turn1');

	const after = await getGameState(page);
	const oppAfter = (after.players.player_2.activeSlots || [])
		.find(s => s && s.cardId === oppBefore.cardId);
	expect(oppAfter, 'opponent starter still on field').toBeTruthy();
	expect(oppAfter.mp, 'the protected starter lost no MP').toBe(oppBefore.mp);
	expect(oppAfter.isDefeated ?? false, 'protected starter must not be defeated').toBe(false);
	expect(after.status, 'no turn-1 knockout').not.toBe('FINISHED');
	const overlayVisible = await page.locator('#reward-overlay').isVisible().catch(() => false);
	expect(overlayVisible, 'no victory overlay on turn 1').toBe(false);
});
