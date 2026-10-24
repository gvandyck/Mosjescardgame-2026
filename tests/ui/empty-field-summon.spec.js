/**
 * empty-field-summon.spec.js - U9: when a player's last Mosje is gone, the cheapest Mosje from their hand appears free and
 * FRESH at the start of their next turn (UI-05, Phase 63-07, R1). The engine does the summon (placeEmptyFieldMosje); the board
 * shows the Welloe pile, the empty field in between, and the new Mosje with its FRESH badge.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection, setHand,
} from './helpers.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

test('U9: an empty field gets the cheapest Mosje from hand, fresh, at the next turn start', async ({ page }) => {
	test.setTimeout(90000);
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	// Own board: ONE Mosje, lying sideways at 10 MP, so the next hit sends it to the Welloe pile. The bot has Power to do it.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_binti', { mp: 10, level: 1, sideways: true });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	// Hand: two Mosjes of different cost (Bulldozer 4, Fissa Fissa 2); no reaction card, so no reaction window opens.
	await setHand(page, 'player_1', ['mosje_alyssa_bulldozer', 'mosje_alyssa_fissa']);
	await setHand(page, 'player_2', []);
	// A known draw: a Piecie, never a cheaper Mosje.
	await page.evaluate(() => window.__testHooks.setDeckTop('player_1', ['piecie_affoe']));
	await page.mouse.move(2, 2);

	expect(await page.evaluate(() => window.__testHooks.botAttack(0, 0))).toBe('ok');
	await expect(page.locator('#welloe-player [data-pile="welloe"][data-count="1"]'), 'the Welloe pile now holds the Mosje').toBeVisible({ timeout: 8000 });
	let gs = await getGameState(page);
	expect(gs.players.player_1.welloePile, 'engine: one Mosje in the Welloe pile').toHaveLength(1);
	expect(gs.players.player_1.activeSlots.filter((s) => s && !s.isDefeated), 'engine: the field is empty').toHaveLength(0);
	expect(gs.status, 'the game goes on').not.toBe('FINISHED');
	await expect(page.locator('#zone-player [data-zone="mosje"]'), 'no Mosje tile on the field').toHaveCount(0);

	// The owner's next turn starts: the cheapest Mosje in hand (cost 2) appears at once, fresh.
	await page.evaluate(() => window.__testHooks.runTurnBoundary('start', 'player_1'));
	gs = await getGameState(page);
	const placed = gs.players.player_1.activeSlots.filter(Boolean);
	expect(placed, 'engine: exactly one Mosje placed').toHaveLength(1);
	expect(placed[0].cardId, 'engine: the cheapest Mosje from hand').toBe('mosje_alyssa_fissa');
	expect(gs.players.player_1.hand.some((c) => c.cardId === 'mosje_alyssa_bulldozer'), 'the dearer Mosje stays in hand').toBe(true);
	expect(gs.status).not.toBe('FINISHED');

	const tile = page.locator('#zone-player [data-zone="mosje"][data-card-id="mosje_alyssa_fissa"]');
	await expect(tile).toBeVisible();
	await expect(tile.locator('[data-badge="fresh"]'), 'the new Mosje wears the FRESH badge').toBeVisible();
	await expect(tile.locator('[data-badge="fresh"]')).toHaveText('FRESH');
	await page.mouse.move(2, 2);
	await page.waitForTimeout(500);
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u9-summon.png` });
});
