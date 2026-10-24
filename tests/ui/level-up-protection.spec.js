/**
 * level-up-protection.spec.js - U4 + A10: the Fresh and Protected badges appear and clear at the engine moments (UI-03,
 * Phase 63-04, D-15, D-06). Fresh = a Mosje that just entered play, until its owner's next turn starts. Protected = a Mosje
 * that levelled up this turn, until its owner's next turn starts. A tap on a badge shows the full reason in a toast.
 * Saves the A10 badge screenshots and one board with every tile state at once (u4-states.png).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, questViaUi, setHand, setEnergy,
} from './helpers.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
}
// Both hands empty: a random opening reaction Snelle would open a reaction window or reroll the forced Quest dice.
async function emptyHands(page) {
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
}
const ownTile = (page, slot) => page.locator(`#zone-player .mosje-card--owned[data-slot-index="${slot}"]`);
const badge = (tile, kind) => tile.locator(`[data-badge="${kind}"]`);

test('U4 + A10: a Fresh Mosje shows the FRESH badge, a tap reads the reason, its owner\'s turn start clears it', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_fissa', { mp: 40, level: 1, entryProtected: true });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1, entryProtected: true });
	await emptyHands(page);
	await page.mouse.move(2, 2);

	const fresh = ownTile(page, 0);
	await expect(badge(fresh, 'fresh')).toBeVisible();
	await expect(badge(fresh, 'fresh')).toHaveText('FRESH');
	await expect(badge(ownTile(page, 1), 'fresh'), 'a Mosje that is not fresh has no badge').toHaveCount(0);
	await expect(page.locator('#zone-opponent [data-slot-index="0"] [data-badge="fresh"]'), "the opponent's fresh Mosje shows it too").toBeVisible();
	await expect(badge(fresh, 'protected')).toHaveCount(0);
	const box = await badge(fresh, 'fresh').boundingBox();
	const tileBox = await fresh.boundingBox();
	expect(box.x + box.width, 'badge inside the tile').toBeLessThanOrEqual(tileBox.x + tileBox.width + 1);
	expect(box.y, 'badge inside the tile').toBeGreaterThanOrEqual(tileBox.y - 1);
	expect(box.height, 'pill readable').toBeGreaterThanOrEqual(14);
	expect(await badge(fresh, 'fresh').evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), 'never below 10px').toBeGreaterThanOrEqual(10);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/a10-badge-fresh.png` });

	// A tap reads the full reason in the toast and does not open the detail view; the toast replaces itself and goes away.
	await badge(fresh, 'fresh').click();
	const toast = page.locator('#board-toast');
	await expect(toast).toHaveText("Fresh: can't attack, can't be chosen by opponent cards, ignores Places");
	await expect(toast).toHaveAttribute('role', 'status');
	await expect(page.locator('.card-detail')).toHaveCount(0);
	await toast.click(); // a tap dismisses it
	await expect(toast).toHaveCount(0);
	await badge(fresh, 'fresh').click();
	await expect(toast).toHaveCount(1);
	await expect(toast, 'auto-dismisses after about 3 s').toHaveCount(0, { timeout: 5000 });

	// The engine moment: the owner's next turn start clears Fresh (player_1's own tile).
	expect((await getGameState(page)).players.player_1.activeSlots[0].entryProtected).toBe(true);
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	await expect(badge(ownTile(page, 0), 'fresh'), 'the badge clears with the engine flag').toHaveCount(0);
	expect((await getGameState(page)).players.player_1.activeSlots[0].entryProtected).toBeFalsy();
	await expect(page.locator('#zone-opponent [data-slot-index="0"] [data-badge="fresh"]'), "the opponent's Mosje stays fresh until THEIR turn starts").toBeVisible();
});

test('U4 + A10: a Quest win that levels a Mosje up shows PROTECTED; it cannot be attacked and the badge clears at turn start', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 95, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await emptyHands(page);
	await expect(badge(ownTile(page, 0), 'protected')).toHaveCount(0);

	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6]);
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	const gs = await getGameState(page);
	const slot = gs.players.player_1.activeSlots[0];
	expect(slot.level, 'engine: the win levelled Binti up').toBe(2);
	expect(slot.levelUpProtected, 'engine: level-up protection').toBe(true);

	await page.mouse.move(2, 2);
	const tile = ownTile(page, 0);
	await expect(tile.locator('[data-cv1-level]')).toHaveAttribute('data-cv1-level', '2');
	await expect(badge(tile, 'protected')).toBeVisible();
	await expect(badge(tile, 'protected')).toHaveText('PROTECTED');
	await expect(badge(tile, 'fresh'), 'levelling up does not make a Mosje Fresh').toHaveCount(0);
	await page.screenshot({ path: `${SHOT_DIR}/a10-badge-protected.png` });

	// A tap reads the reason.
	await badge(tile, 'protected').click();
	await expect(page.locator('#board-toast')).toHaveText("Levelled up this turn: can't be attacked");

	// The engine really protects it: the bot's attack is refused and the MP does not change.
	const mpBefore = slot.mp;
	const result = await page.evaluate(() => window.__testHooks.botAttack(0, 0));
	expect(result, 'attack on a level-up protected Mosje is refused').not.toBe('ok');
	const after = await getGameState(page);
	expect(after.players.player_1.activeSlots[0].mp, 'MP unchanged').toBe(mpBefore);
	expect(after.players.player_1.activeSlots[0].level).toBe(2);

	// The owner's next turn start clears the protection and the badge.
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	await expect(badge(ownTile(page, 0), 'protected')).toHaveCount(0);
	expect((await getGameState(page)).players.player_1.activeSlots[0].levelUpProtected).toBeFalsy();
});

test('U4: one board with every tile state: Fresh, Protected + Level 3 HOLD, sideways, Tactician temp MP and the status strip', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_fissa', { mp: 95, level: 3, levelUpProtected: true });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_binti', { mp: 40, level: 1, entryProtected: true });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 0, level: 1, sideways: true });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_tactician', { mp: 60, level: 2 });
	await emptyHands(page);
	await setEnergy(page, 'player_2', 6);
	// The bot's Tactician sets its own MP to 25 for the turn (real MP 60).
	expect(await page.evaluate(() => window.__testHooks.botUseAbility('mosje_tactician', { target: { playerId: 'player_2', slotIndex: 1 }, mp: 25 }))).toBe('ok');
	await page.mouse.move(2, 2);
	await page.waitForTimeout(400);

	await expect(badge(ownTile(page, 0), 'protected')).toBeVisible();
	await expect(ownTile(page, 0)).toHaveClass(/mosje-card--hold/);
	await expect(ownTile(page, 0).locator('.cv2-tile-lvl')).toHaveText('LVL 3 · HOLD');
	await expect(badge(ownTile(page, 1), 'fresh')).toBeVisible();
	await expect(page.locator('#zone-opponent [data-slot-index="0"]')).toHaveClass(/mosje-card--sideways/);
	await expect(badge(page.locator('#zone-opponent [data-slot-index="0"]'), 'sideways')).toBeVisible();
	const tactician = page.locator('#zone-opponent [data-slot-index="1"]');
	await expect(tactician.locator('[data-cv1-mp] .cv2-tile-val')).toHaveText('25');
	await expect(tactician.locator('[data-cv1-mp] .cv2-tile-sub')).toHaveText('60');
	const strip = page.locator('#status-strip');
	await expect(strip).toHaveAttribute('data-status-kind', 'hold');
	await expect(strip).toHaveText('Alyssa is at Level 3: TestPlayer wins at the start of their next turn');
	await page.screenshot({ path: `${SHOT_DIR}/u4-states.png` });
});
