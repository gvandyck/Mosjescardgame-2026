/**
 * getemt-sideways.spec.js - U3: a Level 1 Mosje hit down to 0 MP lies on its side (UI-03, Phase 63-04, D-16).
 * The tile is rotated 90 degrees and scaled 176/240 so it fits its slot exactly (the row never changes height) and carries an
 * upright "SKIPS TURN" pill with the reason on tap; a second hit while sideways sends it to the Welloe pile.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, getGameState, setMosjeOnField, clearEntryProtection, setHand,
} from './helpers.js';

const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

async function boot(page) {
	await seedOfflineSession(page, 'DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	// slot 0 is the victim (Level 1, 10 MP); slot 1 only keeps a Mosje on the field. Both bot Mosjes have Power 20.
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_fissa', { mp: 10, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_binti', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_destroyer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await clearEntryProtection(page);
	// No hand: nothing can open a reaction window on the bot's attack.
	await setHand(page, 'player_1', []);
	await setHand(page, 'player_2', []);
	await page.mouse.move(2, 2);
}

const ownTile = (page, slot) => page.locator(`#zone-player .mosje-card--owned[data-slot-index="${slot}"]`);

/** Row height of the player row plus the empty Piecie slot height, read in the page. */
const rowHeights = (page) => page.evaluate(() => ({
	row: document.querySelector('.board-zone--player .board-zone__row').getBoundingClientRect().height,
	slot: document.querySelector('#piecies-player .board-slot--empty').getBoundingClientRect().height,
}));

test('U3: a hit to 0 MP at Level 1 turns the tile 90 degrees, scaled to its slot, with an upright SKIPS TURN pill', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	const gs0 = await getGameState(page);
	expect(gs0.players.player_2.activeSlots[0].level).toBe(1);
	expect(await page.evaluate(() => window.__testHooks.getMosjePower('player_2', 0)), 'bot attacker Power').toBeGreaterThanOrEqual(10);
	await expect(ownTile(page, 0).locator('[data-badge]'), 'upright Mosje has no state badge').toHaveCount(0);
	const before = await rowHeights(page);

	expect(await page.evaluate(() => window.__testHooks.botAttack(0, 0))).toBe('ok');
	await expect(ownTile(page, 0).locator('[data-badge="sideways"]')).toBeVisible({ timeout: 8000 });
	const gs = await getGameState(page);
	const slot = gs.players.player_1.activeSlots[0];
	expect(slot.sideways, 'engine: sideways').toBe(true);
	expect(slot.mp, 'engine: MP 0 after getemt').toBe(0);
	expect(slot.isDefeated).toBeFalsy();
	expect(gs.players.player_1.welloePile ?? [], 'a first hit does not send it to the Welloe pile').toHaveLength(0);

	// The pose: a +90 degree rotation scaled 176/240 (matrix a=0, b=s, c=-s, d=0).
	const tile = ownTile(page, 0);
	await expect(tile).toHaveClass(/mosje-card--sideways/);
	const m = await tile.evaluate((el) => {
		const [a, b, c, d] = getComputedStyle(el).transform.match(/-?[\d.]+(?:e-?\d+)?/g).map(Number);
		return { a, b, c, d };
	});
	expect(Math.abs(m.a), 'cos').toBeLessThan(0.01);
	expect(Math.abs(m.d), 'cos').toBeLessThan(0.01);
	expect(m.b, 'sin: +90 degrees').toBeCloseTo(176 / 240, 2);
	expect(m.c).toBeCloseTo(-176 / 240, 2);

	// The row never changes: the tile's visual height equals an empty slot's, and so does the whole row.
	const after = await rowHeights(page);
	const box = await tile.boundingBox();
	expect(Math.abs(box.height - after.slot), `sideways tile ${box.height} vs empty slot ${after.slot}`).toBeLessThanOrEqual(2);
	expect(box.width, 'a sideways tile is narrower than a slot is wide').toBeLessThan(box.height);
	expect(Math.abs(after.row - before.row), 'row height unchanged').toBeLessThanOrEqual(1);

	// The pill stands upright (wider than tall) inside the tile, and a tap reads the reason.
	const pill = tile.locator('[data-badge="sideways"]');
	await expect(pill).toHaveText('SKIPS TURN');
	const pillBox = await pill.boundingBox();
	expect(pillBox.width, 'upright pill').toBeGreaterThan(pillBox.height);
	expect(pillBox.x).toBeGreaterThanOrEqual(box.x - 1);
	expect(pillBox.x + pillBox.width).toBeLessThanOrEqual(box.x + box.width + 1);
	await expect(pill).toHaveAttribute('data-reason', 'Hit at Level 1: skips its next turn. Can still be attacked');
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/u3-sideways.png` });
	await pill.click();
	await expect(page.locator('#board-toast')).toHaveText('Hit at Level 1: skips its next turn. Can still be attacked');
	await expect(page.locator('.card-detail'), 'a badge tap does not open the detail view').toHaveCount(0);

	// The bot attacked, so its attacker shows ACTED and the strip names the bot's turn.
	await expect(page.locator('#zone-opponent [data-slot-index="0"] [data-badge="acted"]')).toBeVisible();
	await expect(page.locator('#status-strip')).toHaveAttribute('data-status-kind', 'bot-turn');
});

test('U3: a second hit while sideways sends the Mosje to the Welloe pile and its slot goes empty', async ({ page }) => {
	test.setTimeout(60000);
	await boot(page);
	await page.evaluate(() => window.__testHooks.botAttack(0, 0));
	await expect(ownTile(page, 0).locator('[data-badge="sideways"]')).toBeVisible({ timeout: 8000 });

	expect(await page.evaluate(() => window.__testHooks.botAttack(1, 0))).toBe('ok');
	await expect(page.locator('#welloe-player [data-pile="welloe"][data-count="1"]')).toBeVisible({ timeout: 8000 });
	await expect(ownTile(page, 0), 'the Mosje left its slot').toHaveCount(0);
	await expect(page.locator('#zone-player .board-slot--empty[data-slot-index="0"]'), 'slot 0 shows an empty outline').toHaveCount(1);
	await expect(ownTile(page, 1), 'the other Mosje stays').toHaveCount(1);
	const gs = await getGameState(page);
	expect(gs.players.player_1.welloePile.map((c) => c.cardId)).toContain('mosje_alyssa_fissa');
	expect(gs.status).not.toBe('FINISHED');
});
