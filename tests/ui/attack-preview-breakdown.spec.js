/**
 * attack-preview-breakdown.spec.js - 72-07 (D-08, D-09, NUI-03): the attack confirm step shows Power, Triangle, Resilient and the
 * total before Confirm; a Power 0 attacker and a fresh target have their own sentences. Real taps on the live board, headless 1920x1080.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, setHand, setQuestFaceUp } from './helpers.js';
import { tapOwnCard, chooseTray, attackByTap, targetTile, statusStrip } from '../helpers/boardTaps.js';

const SHOT_DIR = '.planning/phases/72-screens-for-the-new-design/shots';
const HAND = ['piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_ronald_kip', 'piecie_chefs_special', 'piecie_momentum_boost'];
const lines = (page) => statusStrip(page).locator('.strip-line').allTextContents();

// Own Alyssa (Physical, Power 20) in slot 0; opponent slot 0 = `target`, slot 1 = Ming (Creative, Res 1).
async function boot(page, { target = 'mosje_coert_tech', fresh = false, boost = 0 } = {}) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1, powerBoost: boost });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, target, { mp: 60, level: 1, entryProtected: fresh });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ming_natural', { mp: 60, level: 1 });
	await setHand(page, 'player_1', HAND);
	await setHand(page, 'player_2', []);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out');
	await page.mouse.move(2, 2);
}
const oppMp = async (page, i) => (await getGameState(page)).players.player_2.activeSlots[i].mp;
async function toPreview(page, slot) {
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
	await targetTile(page, `player_2:${slot}`).click();
	await page.locator('#status-strip[data-status-kind="preview"]').waitFor({ timeout: 5000 });
}

test('Physical on Digital Res 1: Power, Triangle, Resilient, total, note; Confirm costs exactly the shown total', async ({ page }) => {
	test.setTimeout(90000);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await boot(page);
	const before = await oppMp(page, 0);
	await toPreview(page, 0);
	expect(await lines(page)).toEqual(['Power 20', 'Triangle +10 (Physical beats Digital)', 'Resilient \u22125 (Res 1)', '= 25 before card effects', 'Card effects can change this']);
	await expect(statusStrip(page).locator('.status-strip__text')).toHaveText('Alyssa hits Coert: \u221225 MP (leaves 35)');
	await expect(targetTile(page, 'player_2:0').locator('[data-target-chip]'), 'the tile chip shows the same total').toHaveText('−25');
	await expect(statusStrip(page).locator('[data-confirm]')).toBeVisible();
	const b = await statusStrip(page).locator('[data-confirm]').boundingBox();
	expect(b.height).toBeGreaterThanOrEqual(44);
	const strip = await statusStrip(page).boundingBox();
	expect(strip.height, 'the strip does not grow').toBeLessThanOrEqual(46);
	await page.mouse.move(2, 2);
	await page.waitForTimeout(300);
	await page.screenshot({ path: `${SHOT_DIR}/72-07-attack-preview.png` });
	await page.locator('#status-strip [data-confirm]').click();
	await page.waitForTimeout(600);
	expect(before - (await oppMp(page, 0)), 'MP lost = the shown total').toBe(25);
});

test('Physical on Creative Res 1: no Triangle line, Resilient -5', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page);
	const before = await oppMp(page, 1);
	await toPreview(page, 1);
	expect(await lines(page)).toEqual(['Power 20', 'Resilient \u22125 (Res 1)', '= 15 before card effects', 'Card effects can change this']);
	await page.locator('#status-strip [data-confirm]').click();
	await page.waitForTimeout(600);
	expect(before - (await oppMp(page, 1))).toBe(15);
});

test('a fresh target shows "Protected until its owner\'s next turn" and stays out of preview', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { fresh: true });
	await tapOwnCard(page, 'mosje', 0);
	await chooseTray(page, 'attack');
	await statusStrip(page).locator('[data-cancel]').waitFor({ state: 'visible', timeout: 5000 });
	await targetTile(page, 'player_2:0').click();
	await expect(page.locator('#board-toast')).toHaveText("Protected until its owner's next turn");
	await expect(statusStrip(page)).toHaveAttribute('data-status-kind', 'choose-target');
});

test('a Power 0 attacker reads "Can\'t attack (Power 0)"', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page, { boost: -20 });
	await toPreview(page, 1).catch(() => {});
	await expect(statusStrip(page).locator('.status-strip__text')).toHaveText("Can't attack (Power 0)");
});
