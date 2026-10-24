/**
 * win-hold-level3.spec.js - U10 + D-18: a Level 3 Mosje HOLDS and wins at the start of its owner's NEXT turn (UI-03,
 * Phase 63-04, D-17); the Tactician's temporary MP shows big with the real MP small (D-18); the status strip shows the
 * cooldown turn (D-19). The win is the engine's checkWin at turn start; the board only shows the hold (chip, gold glow, strip).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection,
	setQuestFaceUp, setNextDice, questViaUi, setHand, setEnergy, injectGraveyardCard,
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
const strip = (page) => page.locator('#status-strip');

test('U10: a Mosje that reaches Level 3 shows LVL 3 · HOLD, a gold hold tile and the strip; the win comes only at the owner\'s next turn start', async ({ page }) => {
	test.setTimeout(90000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 90, level: 2 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	await emptyHands(page);
	await expect(ownTile(page, 0)).not.toHaveClass(/mosje-card--hold/);
	await expect(ownTile(page, 0).locator('.cv2-tile-lvl')).toHaveText('L2');
	await expect(strip(page), 'no hold message before anyone is at Level 3').not.toHaveAttribute('data-status-kind', 'hold');

	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15: 90 + 25 reaches Level 3
	await setNextDice(page, [6, 6, 6]);
	await questViaUi(page, { slot: 0, stackId: 'FIGHTING' });
	let gs = await getGameState(page);
	expect(gs.players.player_1.activeSlots[0].level, 'engine: Level 3').toBe(3);
	expect(gs.status, 'reaching Level 3 does not end the game').not.toBe('FINISHED');
	await page.mouse.move(2, 2);

	// The tile: chip text, hold class, gold ring, data-cv1-level stays 3.
	const tile = ownTile(page, 0);
	await expect(tile.locator('.cv2-tile-lvl')).toHaveText('LVL 3 · HOLD');
	await expect(tile.locator('[data-cv1-level]')).toHaveAttribute('data-cv1-level', '3');
	await expect(tile).toHaveClass(/mosje-card--hold/);
	const shadow = await tile.evaluate((el) => getComputedStyle(el).boxShadow);
	expect(shadow, 'gold ring + glow').toContain('232, 185, 79');
	await expect(ownTile(page, 1).locator('.cv2-tile-lvl'), 'a Level 1 Mosje keeps the short chip').toHaveText('L1');
	await expect(ownTile(page, 1)).not.toHaveClass(/mosje-card--hold/);

	// The status strip says who wins when.
	await expect(strip(page)).toHaveAttribute('data-status-kind', 'hold');
	await expect(strip(page)).toHaveText('Binti is at Level 3: TestPlayer wins at the start of their next turn');
	await page.screenshot({ path: `${SHOT_DIR}/a10-level3-hold.png` });

	// Ending the turn does not win; only the OWNER's next turn start does (U10).
	await page.evaluate(() => window.__testHooks.runTurnBoundary('end'));
	gs = await getGameState(page);
	expect(gs.status, 'still not finished after the turn ends').not.toBe('FINISHED');
	expect(gs.players.player_1.activeSlots[0].level).toBe(3);
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	gs = await getGameState(page);
	expect(gs.status).toBe('FINISHED');
	expect(gs.winnerId).toBe('player_1');
	expect(gs.winReason).toBe('LEVEL_3');
	await expect(strip(page), 'a finished game shows no strip message').not.toHaveAttribute('data-status-kind', /.+/);
});

test('D-17: a Level 3 Mosje on the OPPONENT\'S side also shows the hold message, naming its owner', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 3 });
	await clearEntryProtection(page);
	await emptyHands(page);
	await expect(strip(page)).toHaveAttribute('data-status-kind', 'hold');
	await expect(strip(page)).toHaveText('Gandoe is at Level 3: Bot wins at the start of their next turn');
	await expect(page.locator('#zone-opponent [data-slot-index="0"]')).toHaveClass(/mosje-card--hold/);
	await expect(page.locator('#zone-opponent [data-slot-index="0"] .cv2-tile-lvl')).toHaveText('LVL 3 · HOLD');
});

test('D-18: a Tactician set shows the temporary MP big and the real MP small; the hook keeps the real MP', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 30, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_tactician', { mp: 60, level: 2 });
	await clearEntryProtection(page);
	await emptyHands(page);
	await setEnergy(page, 'player_2', 6);
	const mpBox = ownTile(page, 0).locator('[data-cv1-mp]');
	await expect(mpBox.locator('.cv2-tile-val')).toHaveText('40');
	await expect(mpBox.locator('.cv2-tile-sub'), 'no temp MP: no small number').toHaveCount(0);

	expect(await page.evaluate(() => window.__testHooks.botUseAbility('mosje_tactician', { target: { playerId: 'player_1', slotIndex: 0 }, mp: 25 }))).toBe('ok');
	await page.mouse.move(2, 2);
	const gs = await getGameState(page);
	expect(gs.players.player_1.activeSlots[0].mp, 'engine: the temporary value sits in slot.mp').toBe(25);
	expect(gs.players.player_1.activeSlots[0].tacticianSet.realMp).toBe(40);

	await expect(mpBox.locator('.cv2-tile-val'), 'temporary MP big').toHaveText('25');
	await expect(mpBox.locator('.cv2-tile-sub'), 'real MP small').toHaveText('40');
	await expect(mpBox).toHaveAttribute('data-cv1-mp', '40'); // the hook keeps the REAL MP
	const big = await mpBox.locator('.cv2-tile-val').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	const small = await mpBox.locator('.cv2-tile-sub').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	expect(big, 'the temporary number is bigger than the real one').toBeGreaterThan(small * 1.5);
	await expect(ownTile(page, 1).locator('[data-cv1-mp] .cv2-tile-sub'), 'other Mosjes are untouched').toHaveCount(0);

	// At the end of the turn the set snaps back to the real MP and the small number goes away.
	await page.evaluate(() => window.__testHooks.runTurnBoundary('end', 'player_2'));
	await expect(ownTile(page, 0).locator('[data-cv1-mp] .cv2-tile-sub')).toHaveCount(0);
	await expect(ownTile(page, 0).locator('[data-cv1-mp] .cv2-tile-val')).toHaveText('40');
});

test('D-19: the player\'s cooldown turn shows the cooldown message in the status strip', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 30, level: 1 });
	await clearEntryProtection(page);
	await emptyHands(page);
	await expect(strip(page)).not.toHaveAttribute('data-status-kind', 'cooldown');
	// Deck-out: an empty deck with cards in the discard pile reshuffles on the next draw and sets the cooldown turn.
	await page.evaluate(() => window.__testHooks.emptyDeck('player_1'));
	await injectGraveyardCard(page, 'player_1', 'piecie_affoe');
	await injectGraveyardCard(page, 'player_1', 'piecie_affoe');
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	const gs = await getGameState(page);
	expect(gs.players.player_1.cooldownTurn, 'engine: cooldown turn set').toBe(true);
	await expect(strip(page)).toHaveAttribute('data-status-kind', 'cooldown');
	await expect(strip(page)).toHaveText('Cooldown turn: you can only place face-down Piecies');
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u4-cooldown-strip.png` });
	// The cooldown turn ends with the turn.
	await page.evaluate(() => window.__testHooks.runTurnBoundary('end', 'player_1'));
	await expect(strip(page)).not.toHaveAttribute('data-status-kind', 'cooldown');
});
