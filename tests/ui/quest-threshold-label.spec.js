/**
 * quest-threshold-label.spec.js — Reproduces wrong quest-modal labels for
 * quests with perMosjeConfig (Kickboxing Bootcamp) in a REAL browser.
 *
 * Bug 1 (threshold): the quest-attempt preview modal computed its "Roll
 * needed" threshold via getQuestDiceThreshold(), which only read
 * questDef.roll.thresholds — for Kickboxing Bootcamp a placeholder
 * {1:6, 2:6, 3:6}. The ACTUAL dice roll checks perMosjeConfig first:
 * Michelle succeeds on 4+, Gandoe on 2+. The modal said "6+ to succeed".
 *
 * Bug 2 (success MP): the preview's "On success" line and the dice-result
 * popup both displayed questDef.successMP (+60), while the resolution used
 * perMosjeConfig.successMP (Michelle +80) plus the +20 both-active bonus.
 * The popup said "+60 MP" while the log and the actual award said "+80 MP".
 *
 * These tests drive the full flow — place the quest from hand, activate it,
 * pick the Mosje, roll (forced via window.__forceDiceRoll) — and assert every
 * displayed number matches what the resolution actually awards (checked via
 * the battle log). Pre-fix the Michelle and both-active tests fail.
 */

import { test, expect } from '@playwright/test';
import {
	seedOfflineSession, waitForBoard, GAME_URL_TEST, ss, readLog,
	setMosjeOnField, setHand, unlockPiecies, playCardFromHand,
} from './helpers.js';

const QUEST_ID = 'quest_personal_kickboxing_bootcamp';

/**
 * Board setup → quest preview modal. `mosjes` go into slots 0..n;
 * `pickName` is clicked in the Mosje-select modal.
 */
async function openKickboxingPreview(page, mosjes, pickName) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);

	// Field the Mosjes with enough MP for the 20 MP quest cost.
	for (const [slotIndex, cardId] of mosjes.entries()) {
		await setMosjeOnField(page, 'player_1', slotIndex, cardId, { mp: 60, level: 1 });
	}

	// Place Kickboxing Bootcamp face-down, then unlock so it's activatable now.
	await setHand(page, 'player_1', [QUEST_ID]);
	await playCardFromHand(page, QUEST_ID);
	await unlockPiecies(page, 'player_1');

	// Activate the quest from the piecie zone.
	const activateBtn = page.locator(`#piecies-player [data-card-id="${QUEST_ID}"] button`).first();
	await activateBtn.waitFor({ timeout: 5000 });
	await activateBtn.click();

	// Mosje-select modal → pick the Mosje.
	const mosjeBtn = page.locator('.modal-mosje-select-btn', { hasText: pickName }).first();
	await mosjeBtn.waitFor({ timeout: 5000 });
	await mosjeBtn.click();

	// Quest-attempt preview modal.
	const previewModal = page.locator('.modal-card--mosje-detail');
	await previewModal.waitFor({ timeout: 5000 });
	return previewModal;
}

/** From the open preview modal: force the die, roll, and return the result panel. */
async function attemptAndRoll(page, forcedRoll) {
	await page.evaluate((v) => { window.__forceDiceRoll = v; }, forcedRoll);
	await page.click('#modal-attempt');
	await page.click('#modal-roll');
	const resultPanel = page.locator('#dice-result');
	await resultPanel.waitFor({ state: 'visible', timeout: 10000 });
	return resultPanel;
}

test('Kickboxing Bootcamp with Michelle: modal shows 4+ and +80 MP, matching the award', async ({ page }) => {
	test.setTimeout(90000);
	const previewModal = await openKickboxingPreview(page, ['mosje_michelle'], 'Michelle');

	// Bug 1: perMosjeConfig says Michelle rolls 4+, not the placeholder 6+.
	await expect(previewModal.locator('p', { hasText: 'Roll needed:' })).toContainText('4+ to succeed');
	// Bug 2: her success reward is +80, not the base +60.
	await expect(previewModal.locator('p', { hasText: 'On success:' })).toContainText('+80 MP');
	await ss(page, 'quest-threshold-label-michelle');

	// Roll exactly her threshold: the result popup must show her +80.
	const resultPanel = await attemptAndRoll(page, 4);
	await expect(resultPanel).toContainText('Rolled 4');
	await expect(resultPanel.locator('.dice-result-mp')).toContainText('+80 MP');
	await ss(page, 'quest-dice-result-michelle');

	// The displayed number must be what the resolution actually awards.
	await page.click('#modal-done');
	await expect.poll(async () => (await readLog(page)).join('\n'), { timeout: 5000 })
		.toContain('Success (+80 MP)');
});

test('Kickboxing Bootcamp with Gandoe: modal shows 2+ and +60 MP, matching the award', async ({ page }) => {
	test.setTimeout(90000);
	const previewModal = await openKickboxingPreview(page, ['mosje_gandoe_destroyer'], 'Gandoe');

	await expect(previewModal.locator('p', { hasText: 'Roll needed:' })).toContainText('2+ to succeed');
	await expect(previewModal.locator('p', { hasText: 'On success:' })).toContainText('+60 MP');
	await ss(page, 'quest-threshold-label-gandoe');

	const resultPanel = await attemptAndRoll(page, 2);
	await expect(resultPanel.locator('.dice-result-mp')).toContainText('+60 MP');

	await page.click('#modal-done');
	await expect.poll(async () => (await readLog(page)).join('\n'), { timeout: 5000 })
		.toContain('Success (+60 MP)');
});

test('Kickboxing Bootcamp with BOTH active: Michelle\'s modal shows +100 MP (80 + 20 bonus)', async ({ page }) => {
	test.setTimeout(90000);
	const previewModal = await openKickboxingPreview(
		page, ['mosje_gandoe_destroyer', 'mosje_michelle'], 'Michelle');

	await expect(previewModal.locator('p', { hasText: 'Roll needed:' })).toContainText('4+ to succeed');
	// Both Kickboxers on field → +80 base + 20 bonus = +100 on success.
	await expect(previewModal.locator('p', { hasText: 'On success:' })).toContainText('+100 MP');

	const resultPanel = await attemptAndRoll(page, 4);
	await expect(resultPanel.locator('.dice-result-mp')).toContainText('+100 MP');
	await ss(page, 'quest-dice-result-both-active');

	// Resolution already awarded 80+20 pre-fix; the displays must now agree.
	await page.click('#modal-done');
	await expect.poll(async () => (await readLog(page)).join('\n'), { timeout: 5000 })
		.toContain('Success (+100 MP)');
});
