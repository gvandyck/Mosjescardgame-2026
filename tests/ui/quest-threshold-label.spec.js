/**
 * quest-threshold-label.spec.js — Reproduces the wrong "Roll needed" label for
 * quests with perMosjeConfig (Kickboxing Bootcamp) in a REAL browser.
 *
 * The bug: the quest-attempt preview modal computed its threshold via
 * getQuestDiceThreshold(), which only reads questDef.roll.thresholds — for
 * Kickboxing Bootcamp that's a placeholder {1:6, 2:6, 3:6}. The ACTUAL dice
 * roll (runQuestDiceRoll in main.js) checks questDef.perMosjeConfig first:
 * Michelle succeeds on 4+, Gandoe on 2+. So the modal said "6+ to succeed"
 * while the real roll used 4+/2+.
 *
 * These tests drive the full flow — place the quest from hand, activate it,
 * pick the Mosje — and assert the modal label matches the per-Mosje threshold
 * the roll actually uses. Pre-fix both fail ("6+ to succeed"); post-fix pass.
 */

import { test, expect } from '@playwright/test';
import {
	seedOfflineSession, waitForBoard, GAME_URL_TEST, ss,
	setMosjeOnField, setHand, unlockPiecies, playCardFromHand,
} from './helpers.js';

const QUEST_ID = 'quest_personal_kickboxing_bootcamp';

/**
 * Board setup → quest preview modal, returns the "Roll needed" line text.
 * mosjeCardId is placed in slot 0 and picked in the Mosje-select modal.
 */
async function openKickboxingPreview(page, mosjeCardId, mosjeName) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Only the chosen Mosje on field, with enough MP for the 20 MP quest cost.
	await setMosjeOnField(page, 'player_1', 0, mosjeCardId, { mp: 60, level: 1 });

	// Place Kickboxing Bootcamp face-down, then unlock so it's activatable now.
	await setHand(page, 'player_1', [QUEST_ID]);
	await playCardFromHand(page, QUEST_ID);
	await unlockPiecies(page, 'player_1');

	// Activate the quest from the piecie zone.
	const activateBtn = page.locator(`#piecies-player [data-card-id="${QUEST_ID}"] button`).first();
	await activateBtn.waitFor({ timeout: 5000 });
	await activateBtn.click();

	// Mosje-select modal → pick the Mosje.
	const mosjeBtn = page.locator('.modal-mosje-select-btn', { hasText: mosjeName }).first();
	await mosjeBtn.waitFor({ timeout: 5000 });
	await mosjeBtn.click();

	// Quest-attempt preview modal.
	const previewModal = page.locator('.modal-card--mosje-detail');
	await previewModal.waitFor({ timeout: 5000 });
	return previewModal;
}

test('Kickboxing Bootcamp preview shows Michelle\'s real threshold (4+)', async ({ page }) => {
	test.setTimeout(90000);
	const previewModal = await openKickboxingPreview(page, 'mosje_michelle', 'Michelle');

	await ss(page, 'quest-threshold-label-michelle');

	// perMosjeConfig says Michelle rolls 4+ — the label must agree with the
	// threshold runQuestDiceRoll actually uses. Pre-fix this shows "6+".
	const rollNeeded = previewModal.locator('p', { hasText: 'Roll needed:' });
	await expect(rollNeeded).toContainText('4+ to succeed');
});

test('Kickboxing Bootcamp preview shows Gandoe\'s real threshold (2+)', async ({ page }) => {
	test.setTimeout(90000);
	const previewModal = await openKickboxingPreview(page, 'mosje_gandoe_destroyer', 'Gandoe');

	await ss(page, 'quest-threshold-label-gandoe');

	const rollNeeded = previewModal.locator('p', { hasText: 'Roll needed:' });
	await expect(rollNeeded).toContainText('2+ to succeed');
});
