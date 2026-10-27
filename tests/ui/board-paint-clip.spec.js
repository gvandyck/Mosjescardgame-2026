/**
 * board-paint-clip.spec.js - Phase 64.1, D-03 / D-05: nothing painted AROUND a board tile may be cut by the board.
 * Gandalf saw the deck/graveyard count badge and the stack edge cut flat on the live 2.0-A.1 board. The board has TWO clip
 * layers: #board-root (overflow: hidden, only 6 px under the bottom tile row) and every row, an overflow-x: auto scroll box
 * that also clips vertically (10 px above, 18 px below each tile). Measured on 2.0-A.1 at 1920x1080: board 100..733, player
 * pile bottom 727, badge bottom 735, stack layers bottom 738 (5 px over; 6 px at 1920x950, 8 px at 1600x900).
 * This spec measures paint (rect + box-shadow + outline) against the padding box of EVERY clipping ancestor, at rest and under
 * hover / selection / Level 3 HOLD, for both sides and both piles (and the Welloe pile). Written first, seen failing on 2.0-A.1.
 * Budget guards: the fix must not shrink the tiles by more than 5 % in height (1920x1080, 1920x950), keep them 170 px wide at
 * 1600x900, and must not make the 1280x800 bottom-row cut worse (Phase 65 owns that viewport).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection, setHand, injectGraveyardCard,
} from './helpers.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';
import { tapOwnCard, cancelSelection } from '../helpers/boardTaps.js';

const VIEWPORTS = [
	{ width: 1920, height: 1080 },
	{ width: 1920, height: 950 },
	{ width: 1600, height: 900 },
];
const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

// Smallest player tile on 2.0-A.1 (measured on 2.0-A.1, 2026-10-27): the height budget the fix must keep within 95 %.
const TILE_ON_A1 = {
	'1920x1080': { h: 176 },
	'1920x950': { h: 135.33 },
	'1600x900': { h: 131.94, w: 179.91 },
};
// How far the player tiles hang below the board's padding box at 1280x800 on 2.0-A.1 (measured on 2.0-A.1, 2026-10-27).
const CUT_1280_ON_A1 = 64.02;

/** Seeded board: a Mosje on each side, one hand card, two graveyard cards each (so every badge and pile stack exists). */
async function seed(page, viewport) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.setViewportSize(viewport);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 50 });
	await clearEntryProtection(page);
	await setHand(page, 'player_1', ['piecie_affoe']);
	for (const pid of ['player_1', 'player_2']) {
		await injectGraveyardCard(page, pid, 'piecie_affoe');
		await injectGraveyardCard(page, pid, 'piecie_broodje_doner');
	}
	await page.evaluate(() => window.__testHooks.rerender());
	await page.mouse.move(2, 2);
	await page.waitForTimeout(700); // the hand re-fans and its transition settles
}

/** Soft check (every failing step is reported, not just the first): no violation of any clipping ancestor. */
async function check(page, selector, opts, what, label) {
	const list = await readPaintOverflow(page, selector, opts);
	expect.soft(list, `${what} at ${label}: ${JSON.stringify(list)}`).toEqual([]);
}

/** A pile's own rect + shadow + badge, then its stack layers (rect only: their random 3D tilt is judged by the rect). */
async function checkPile(page, container, what, label) {
	await check(page, `${container} .discard-pile, ${container} .discard-pile__count-badge`, {}, what, label);
	await check(page, `${container} .discard-pile__card-layer`, { shadow: false }, `${what} layers`, label);
}

async function hover(page, selector) {
	await page.locator(selector).first().hover();
	await page.waitForTimeout(300);
}

/** Smallest player tile height/width, and how far the player tiles hang below the board's padding box (cut > 0). */
function geometry(page) {
	return page.evaluate(() => {
		const tiles = [...document.querySelectorAll('#zone-player > [data-slot-kind], #piecies-player > [data-slot-kind]')]
			.map((el) => el.getBoundingClientRect());
		const board = document.getElementById('board-root');
		const b = board.getBoundingClientRect();
		const boardBottom = b.top + board.clientTop + board.clientHeight;
		return {
			tiles: tiles.length,
			tileH: Math.min(...tiles.map((t) => t.height)),
			tileW: Math.min(...tiles.map((t) => t.width)),
			cut: Math.max(...tiles.map((t) => t.bottom)) - boardBottom,
		};
	});
}

for (const viewport of VIEWPORTS) {
	const label = `${viewport.width}x${viewport.height}`;

	test(`D-05: nothing painted around a tile is cut at ${label}`, async ({ page }) => {
		test.setTimeout(90000);
		await seed(page, viewport);

		// Presence guards: the checks below must never pass because their selector matched nothing.
		expect(await page.locator('#deck-player .discard-pile__count-badge').count(), 'own deck badge').toBe(1);
		expect(await page.locator('#discard-player .discard-pile__count-badge').count(), 'own graveyard badge').toBe(1);
		expect(await page.locator('#discard-opponent .discard-pile__count-badge').count(), 'opponent graveyard badge').toBe(1);
		expect(await page.locator('#deck-opponent .discard-pile__count-badge').count(), 'opponent deck count stays hidden (T-64.1-01)').toBe(0);
		expect(await page.locator('#board-root .discard-pile__card-layer').count(), 'pile stack layers').toBeGreaterThanOrEqual(8);

		// Budget: the fix may not eat more than 5 % of the tile height (the tile width floor is 170 px).
		const g = await geometry(page);
		console.log('[64.1 geometry]', label, JSON.stringify(g));
		if (label !== '1600x900') expect(g.tileH, `tile height at ${label}`).toBeGreaterThanOrEqual(0.95 * TILE_ON_A1[label].h);
		else expect(g.tileW, `tile width at ${label}`).toBeGreaterThanOrEqual(170);

		// At rest: badges, piles (rect + shadow), stack layers (rect), End Turn (rect + halo).
		await check(page, '#board-root .discard-pile__count-badge', {}, 'badges at rest', label);
		await check(page, '#board-root .discard-pile', {}, 'piles at rest', label);
		await check(page, '#board-root .discard-pile__card-layer', { shadow: false }, 'pile layers at rest', label);
		await check(page, '#btn-end-turn', {}, 'End Turn at rest', label);

		// Hover lifts: the player graveyard and deck, the opponent graveyard (its lift against the board top and the row top).
		await hover(page, '#discard-player .discard-pile');
		await checkPile(page, '#discard-player', 'player graveyard hovered', label);
		await hover(page, '#deck-player .discard-pile');
		await checkPile(page, '#deck-player', 'player deck hovered', label);
		await hover(page, '#discard-opponent .discard-pile');
		await checkPile(page, '#discard-opponent', 'opponent graveyard hovered', label);

		// Hover on tiles and on End Turn (tile hover shadow, End Turn halo).
		await hover(page, '#zone-player [data-zone="mosje"]');
		await check(page, '#zone-player [data-zone="mosje"]', {}, 'player Mosje tile hovered', label);
		await hover(page, '#zone-opponent [data-zone="mosje"]');
		await check(page, '#zone-opponent [data-zone="mosje"]', {}, 'opponent Mosje tile hovered', label);
		await hover(page, '#btn-end-turn');
		await check(page, '#btn-end-turn', {}, 'End Turn hovered', label);

		// A selected own tile: lift + outline.
		await page.mouse.move(2, 2);
		await tapOwnCard(page, 'mosje', 0);
		await page.waitForTimeout(300);
		expect(await page.locator('#zone-player .is-selected').count(), 'a selected own tile').toBe(1);
		await check(page, '#zone-player .is-selected', {}, 'selected own tile', label);
		await cancelSelection(page);

		// Level 3 HOLD glow on both rows.
		await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 50, level: 3 });
		await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 50, level: 3 });
		await clearEntryProtection(page);
		await page.mouse.move(2, 2);
		await page.waitForTimeout(300);
		expect(await page.locator('#board-root .mosje-card--hold').count(), 'Level 3 HOLD tiles (one per side)').toBe(2);
		await check(page, '#board-root .mosje-card--hold', {}, 'Level 3 HOLD glow', label);

		fs.mkdirSync(SHOT_DIR, { recursive: true });
		await page.screenshot({ path: `${SHOT_DIR}/paint-clip-${label}.png` });
	});

	test(`D-05: Welloe piles on both sides are not cut at ${label}`, async ({ page }) => {
		test.setTimeout(90000);
		await seed(page, viewport);
		await page.evaluate(() => {
			window.__testHooks.injectWelloeMosje('player_1', 'mosje_binti');
			window.__testHooks.injectWelloeMosje('player_2', 'mosje_binti');
			window.__testHooks.rerender();
		});
		await page.waitForTimeout(300);
		expect(await page.locator('#board-root .welloe-pile').count(), 'a Welloe pile on each side').toBe(2);

		await check(page, '#board-root .welloe-pile', {}, 'Welloe piles', label);
		await check(page, '#board-root .discard-pile__count-badge', {}, 'badges with Welloe piles (8 columns)', label);
		await check(page, '#board-root .discard-pile__card-layer', { shadow: false }, 'pile layers with Welloe piles (8 columns)', label);
	});
}

test('1280x800: the bottom row is not cut more than on 2.0-A.1 (Phase 65 owns it)', async ({ page }) => {
	test.setTimeout(90000);
	await seed(page, { width: 1280, height: 800 });
	const g = await geometry(page);
	console.log('[64.1 geometry]', '1280x800', JSON.stringify(g));
	expect(g.cut, 'player tiles below the board bottom').toBeLessThanOrEqual(CUT_1280_ON_A1 + 1);
});
