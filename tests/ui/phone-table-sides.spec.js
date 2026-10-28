/**
 * phone-table-sides.spec.js - Phase 65-04 (MOB-01 first half; D-04, D-05, D-06, D-15, D-19 a): on a touch phone each side of the
 * table wraps into 2 lines (2 Mosje slots, then 3 Piecie slots), every tile comes from the one tile token (--field-tile-w, so
 * --bu scales every face), nothing scrolls sideways, and the Energy gems and the deck / discard piles sit in a side cell next to
 * the Mosje line with 44 px controls. The Welloe pile is a 44 px pill in the zone header, only while it has cards. The opponent's
 * side can shrink by --opp-scale (default 1, down to 0.7; plan 05 sets it) without a control dropping below 44 px.
 * Runs at 390x844, 360x740 and the Pixel 8 Pro visible size 395x731. The middle strip (Quests, Place) and the whole-table fit
 * are plan 05; emulation proves geometry and taps, whether 108 px tiles read well is Gandalf's eye (65-HUMAN-UAT.md).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, injectGraveyardCard } from './helpers.js';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { intersects, undersized, pageOverflow } from '../helpers/phoneGeometry.js';
import { readSide } from '../helpers/readSide.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';
import { collectFaceZones, findFaceCollisions } from '../helpers/faceZones.js';

const VIEWPORTS = [...PHONE_VIEWPORTS, PIXEL_VIEWPORT];
const SIDES = ['player', 'opponent'];
const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const MARGIN = 4;                                  // every box keeps this far from the screen edge
const CONTROLS = '[data-pile="deck"], [data-pile="discard"], [data-pile="welloe"]';
const FACE_TILES = '#board-root .board-zone .card-v1--field';

const spread = (boxes, key) => Math.max(...boxes.map((b) => b[key])) - Math.min(...boxes.map((b) => b[key]));
const inside = (b, vw) => b.x >= MARGIN && b.right <= vw - MARGIN;
const within = (inner, outer) => inner.x >= outer.x - 0.5 && inner.right <= outer.right + 0.5 && inner.y >= outer.y - 0.5 && inner.bottom <= outer.bottom + 0.5;

/** The full board plus 2 cards in each discard pile (the count badge shows from 2 cards). */
async function seedSides(page, opts = {}) {
	await seedPhoneBoard(page, { energy: 4, ...opts });
	for (const pid of ['player_1', 'player_2']) {
		await injectGraveyardCard(page, pid, 'piecie_kannetje_melk');
		await injectGraveyardCard(page, pid, 'piecie_broodje_doner');
	}
	await page.evaluate(() => window.__testHooks.rerender());
	await page.waitForTimeout(400);
	// Plan 65-05 now writes --opp-scale / --me-scale itself (at 395x731 the table is too tall at scale 1). This spec judges the two sides
	// AT scale 1 (or sets a scale itself), so it pins both on the board, exactly as (c) and scaleOpponent below do. Assertions unchanged.
	await page.evaluate(() => {
		const board = document.getElementById('board-root');
		board.style.setProperty('--opp-scale', '1');
		board.style.setProperty('--me-scale', '1');
	});
	await page.waitForTimeout(150);
}

/** Both sides as readSide numbers. */
async function readBoth(page) {
	return { player: await readSide(page, 'player'), opponent: await readSide(page, 'opponent') };
}

/** The opponent's side at a scale (the board's own custom property, exactly how plan 05 sets it); null = back to the default 1. */
async function scaleOpponent(page, scale) {
	await page.evaluate((v) => document.getElementById('board-root').style.setProperty('--opp-scale', String(v)), scale);
	await page.waitForTimeout(150);
}

/** Every box a side holds that must not overlap another: the 5 tiles, the Energy row and the piles (plus the Welloe pill). */
function partsOf(s) {
	return [
		...s.slots.map((box, i) => ({ name: `Mosje ${i + 1}`, box })),
		...s.piecies.map((box, i) => ({ name: `Piecie ${i + 1}`, box })),
		{ name: 'Energy', box: s.energy }, { name: 'deck', box: s.deck }, { name: 'discard', box: s.discard },
		...(s.welloe ? [{ name: 'Welloe pill', box: s.welloe }] : []),
		...(s.name ? [{ name: 'player name', box: s.name }] : []),
	];
}

/** (b) 2 lines: the 2 Mosje slots on one top, the 3 Piecie slots on one top below them, same left edge, all inside the screen. */
function expectTwoLines(side, s, vw) {
	expect(s.slots, `${side}: 2 Mosje slots`).toHaveLength(2);
	expect(s.piecies, `${side}: 3 Piecie slots`).toHaveLength(3);
	expect(spread(s.slots, 'y'), `${side}: Mosje tops ${JSON.stringify(s.slots.map((b) => b.y))}`).toBeLessThanOrEqual(2);
	expect(spread(s.piecies, 'y'), `${side}: Piecie tops ${JSON.stringify(s.piecies.map((b) => b.y))}`).toBeLessThanOrEqual(2);
	expect(Math.min(...s.piecies.map((b) => b.y)), `${side}: line 2 sits below line 1`).toBeGreaterThanOrEqual(Math.max(...s.slots.map((b) => b.bottom)) - 2);
	expect(Math.abs(s.slots[0].x - s.piecies[0].x), `${side}: both lines start at the same left edge`).toBeLessThanOrEqual(2);
	for (const [i, b] of [...s.slots, ...s.piecies].entries()) {
		expect(inside(b, vw), `${side}: tile ${i + 1} inside the screen with ${MARGIN} px margin (x ${b.x}..${b.right} of ${vw})`).toBe(true);
	}
}

/** (d) The side cell: 6 gems with N/6, deck and discard at least 44x44 with their badge inside, and nothing overlapping. */
async function expectSideCell(page, side, s, vw) {
	expect(s.gems, `${side}: 6 Energy gems`).toBe(6);
	expect(s.energyText, `${side}: the Energy count reads N/6`).toMatch(/^\d\/6$/);
	expect(s.energy && inside(s.energy, vw), `${side}: the Energy row is inside the screen (${JSON.stringify(s.energy)})`).toBe(true);
	for (const kind of ['deck', 'discard']) {
		const p = s[kind];
		expect(p && p.w >= 44 && p.h >= 44, `${side} ${kind} pile is at least 44x44 (${p ? `${p.w}x${p.h}` : 'missing'})`).toBe(true);
		expect(inside(p, vw), `${side} ${kind} pile is inside the screen`).toBe(true);
	}
	// The count badges: my deck, and every discard pile with 2+ cards. The opponent's deck size stays hidden (no badge, by rule).
	for (const [kind, shown] of [['deck', side === 'player'], ['discard', true]]) {
		if (shown) expect(s[kind].badge && within(s[kind].badge, s[kind]), `${side} ${kind}: the count badge sits inside its box (${JSON.stringify(s[kind].badge)})`).toBe(true);
		else expect(s[kind].badge, `${side} ${kind}: the opponent's deck count stays hidden`).toBeNull();
	}
	expect(await undersized(page, CONTROLS), 'every pile control is at least 44x44').toEqual([]);
	const parts = partsOf(s);
	for (let i = 0; i < parts.length; i += 1) {
		for (let j = i + 1; j < parts.length; j += 1) {
			expect(intersects(parts[i].box, parts[j].box), `${side}: ${parts[i].name} ${JSON.stringify(parts[i].box)} overlaps ${parts[j].name} ${JSON.stringify(parts[j].box)}`).toBe(false);
		}
	}
}

for (const vp of VIEWPORTS) {
	test.describe(`phone table sides at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedSides(page);
		});

		test('(a) nothing scrolls sideways: page, board and every row', async ({ page }) => {
			const over = await pageOverflow(page);
			expect(over.x, 'page overflow x').toBeLessThanOrEqual(0);
			const board = await page.evaluate(() => {
				const root = document.getElementById('board-root');
				return { scrollW: root.scrollWidth, clientW: root.clientWidth };
			});
			expect(board.scrollW, `#board-root scrollWidth ${board.scrollW} vs clientWidth ${board.clientW}`).toBeLessThanOrEqual(board.clientW);
			for (const side of SIDES) {
				const row = (await readSide(page, side)).row;
				expect(row.scrollW, `${side} row scrollWidth ${row.scrollW} vs clientWidth ${row.clientW}`).toBeLessThanOrEqual(row.clientW + 1);
			}
		});

		test('(b) each side is 2 lines: 2 Mosje slots, then 3 Piecie slots', async ({ page }) => {
			const both = await readBoth(page);
			for (const side of SIDES) expectTwoLines(side, both[side], vp.width);
		});

		test('(c) the tile comes from one token: 105-150 px, 240:176, --bu = width / 240', async ({ page }) => {
			const { player: me, opponent: opp } = await readBoth(page);
			console.log(`REPORT ${vp.name}: my tile ${me.tile.w.toFixed(2)} x ${me.tile.h.toFixed(2)} (offsetWidth ${me.tile.offsetW}), opponent ${opp.tile.w.toFixed(2)}`);
			expect(me.tile.w, 'my tile width').toBeGreaterThanOrEqual(105);
			expect(me.tile.w, 'my tile width').toBeLessThanOrEqual(150);
			expect(Math.abs(me.tile.h / me.tile.w / (176 / 240) - 1), 'aspect 240:176 within 1 %').toBeLessThan(0.01);
			expect(Math.abs(me.tile.bu / (me.tile.w / 240) - 1), '--bu equals width / 240 within 1 %').toBeLessThan(0.01);
			expect(opp.tile.w, 'the opponent tile is not bigger than mine').toBeLessThanOrEqual(me.tile.w + 0.5);
			// At scale 1 the token is the board content width (screen - 2 x 12 px padding) minus 2 gaps of 6 px, over 3 tiles.
			await page.evaluate(() => {
				const root = document.getElementById('board-root');
				root.style.setProperty('--me-scale', '1');
				root.style.setProperty('--opp-scale', '1');
			});
			const one = (await readSide(page, 'player')).tile.w;
			expect(Math.abs(one - (vp.width - 36) / 3), `tile ${one.toFixed(2)} vs (${vp.width} - 36) / 3`).toBeLessThanOrEqual(1);
		});

		test('(d) the side cell: Energy row, deck and discard are 44 px, badged, overlapping nothing', async ({ page }) => {
			const both = await readBoth(page);
			for (const side of SIDES) await expectSideCell(page, side, both[side], vp.width);
			for (const side of SIDES) {
				const welloe = await page.evaluate((id) => getComputedStyle(document.getElementById(id)).display, `welloe-${side}`);
				expect(welloe, `${side}: no Welloe cards, no Welloe element displayed`).toBe('none');
			}
			expect(await page.locator('[data-pile="welloe"]').count(), 'no Welloe pile button without cards').toBe(0);
		});

		test('(e) tapping my discard pile by touch opens the discard list, and it closes', async ({ page }) => {
			await page.locator('[data-zone="player"] [data-pile="discard"]').tap();
			const list = page.locator('.modal-card', { hasText: 'Graveyard' });
			await expect(list).toBeVisible();
			await expect(list.locator('.graveyard-card-option').first()).toBeVisible();
			await page.locator('#modal-close-graveyard').tap();
			await expect(page.locator('.modal-card')).toHaveCount(0);
		});

		test('(g) --opp-scale 0.7: the opponent tile shrinks, every control stays 44 px, nothing overlaps', async ({ page }) => {
			const before = await readSide(page, 'player');
			await scaleOpponent(page, 0.7);
			const both = await readBoth(page);
			expect(Math.abs(both.opponent.tile.w - 0.7 * both.player.tile.w), `opponent ${both.opponent.tile.w} vs 0.7 x ${both.player.tile.w}`).toBeLessThanOrEqual(1);
			expect(Math.abs(both.player.tile.w - before.tile.w), 'my tile is not touched by the opponent scale').toBeLessThanOrEqual(0.5);
			for (const side of SIDES) {
				expectTwoLines(side, both[side], vp.width);
				await expectSideCell(page, side, both[side], vp.width);
			}
			const over = await pageOverflow(page);
			expect(over.x, 'page overflow x').toBeLessThanOrEqual(0);
			for (const side of SIDES) expect(both[side].row.scrollW, `${side} row at 0.7`).toBeLessThanOrEqual(both[side].row.clientW + 1);
		});

		test('(h) my faces (100 px and up) have no text collisions; the opponent at 0.7 is only reported', async ({ page }) => {
			const rows = await page.evaluate(collectFaceZones, FACE_TILES);
			const big = rows.filter((r) => r.width >= 100);
			expect(big.length, 'tiles at 100 px and up: both sides at scale 1').toBeGreaterThanOrEqual(10);
			expect(Math.max(...big.map((r) => r.width)), 'these are the phone tiles (150 px at most), not the desktop size').toBeLessThanOrEqual(150);
			expect(findFaceCollisions(big), 'face collisions at the phone tile size').toEqual([]);
			await scaleOpponent(page, 0.7);
			const small = (await page.evaluate(collectFaceZones, FACE_TILES)).filter((r) => r.width < 100);
			expect(small.length, 'the opponent tiles below 100 px at --opp-scale 0.7').toBeGreaterThanOrEqual(5);
			const found = findFaceCollisions(small);
			console.log(`REPORT ${vp.name}: ${small.length} opponent tiles at 0.7 (${small[0]?.width.toFixed(1)} px wide), collisions: ${found.length ? found.join(' | ') : 'none'}`);
		});

		test('(i) nothing paints outside a clipping ancestor: piles and empty slots', async ({ page }) => {
			expect(await readPaintOverflow(page, '[data-pile], #board-root .board-slot--empty')).toEqual([]);
		});
	});

	test.describe(`phone Welloe pill at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedSides(page, { welloe: true });
		});

		test('(f) the pile shows only with cards: a 44 px pill in the header, inside the screen, over nothing (also at 0.7)', async ({ page }) => {
			for (const scale of [1, 0.7]) {
				await scaleOpponent(page, scale);
				const both = await readBoth(page);
				const w = both.opponent.welloe;
				expect(w, `Welloe pill at scale ${scale}`).not.toBeNull();
				expect(w.h, `Welloe pill height at scale ${scale}`).toBeGreaterThanOrEqual(44);
				expect(inside(w, vp.width), `Welloe pill inside the screen (${JSON.stringify(w)})`).toBe(true);
				expect(both.player.welloe, 'my side has no Welloe cards, so no pill').toBeNull();
				await expectSideCell(page, 'opponent', both.opponent, vp.width); // includes "the pill overlaps no tile, Energy, pile or the name"
				expectTwoLines('opponent', both.opponent, vp.width);
				expect(await page.locator('[data-pile="welloe"]').count(), 'exactly one Welloe pile button').toBe(1);
			}
		});
	});

	test.describe(`phone fresh game sides at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test('(j) empty and face-down slots keep the same grid and size as full tiles', async ({ page }) => {
			test.setTimeout(90000);
			// A fresh game: most slots are empty dashed outlines. Then one face-down Piecie goes onto the opponent's side.
			await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
			await page.goto(GAME_URL_TEST);
			await waitForBoard(page);
			const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]').first();
			if (await draw.isVisible().catch(() => false)) await draw.tap();
			await page.evaluate(() => window.__testHooks.setPiecieOnField('player_2', 0, 'piecie_momentum_boost', { faceDown: true }));
			await page.evaluate(() => window.__testHooks.rerender());
			await page.waitForTimeout(500);
			const both = await readBoth(page);
			for (const side of SIDES) expectTwoLines(side, both[side], vp.width);
			const sizes = await page.evaluate(() => [...document.querySelectorAll('#board-root .board-zone--player .board-zone__slots > *, #board-root .board-zone--player .board-zone__piecies > *')]
				.map((el) => ({ empty: el.classList.contains('board-slot--empty'), w: Math.round(parseFloat(getComputedStyle(el).width) * 10) / 10 })));
			expect(sizes.some((s) => s.empty), `a fresh game shows empty slots ${JSON.stringify(sizes)}`).toBe(true);
			expect(Math.max(...sizes.map((s) => s.w)) - Math.min(...sizes.map((s) => s.w)), `all 5 of my slots are one width ${JSON.stringify(sizes)}`).toBeLessThanOrEqual(1);
			const opp = await page.evaluate(() => [...document.querySelectorAll('#board-root .board-zone--opponent .board-zone__piecies > *')].map((el) => Math.round(parseFloat(getComputedStyle(el).width) * 10) / 10));
			expect(Math.max(...opp) - Math.min(...opp), `the opponent's Piecie widths ${JSON.stringify(opp)} (a face-down tile is as wide as an empty one)`).toBeLessThanOrEqual(1);
		});
	});
}

// Pictures for the progress report (not committed, written outside the repo).
test.describe('65-04 screenshots', () => {
	test.describe('phone 390x844 (touch)', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('the seeded table at 390x844', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedSides(page, { hand: ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'place_drain_zone'] });
			await page.screenshot({ path: `${SHOT_DIR}/65-04-phone-390x844.png` });
		});
	});
	test.describe('desktop 1920x1080 (mouse)', () => {
		test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });
		test('the seeded table at 1920x1080', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedSides(page, { hand: ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'place_drain_zone'] });
			await page.mouse.move(2, 2);
			await page.waitForTimeout(500);
			await page.screenshot({ path: `${SHOT_DIR}/65-04-desktop-1920x1080.png` });
		});
	});
});
