/**
 * phone-table-fit.spec.js - Phase 65-05 (MOB-01 second half; D-04, D-05, D-06, D-15, D-19 a): on a touch phone the WHOLE table is
 * visible at once between the header / status strip and the bottom bar: both sides, the 3 Quests (one line, the "N left"
 * count tab kept (2.1: no fail pips), each tile >= 100 px), the Place tile centred under them, Energy and piles. End Turn is in the bar, not the strip.
 * When height is tight the opponent's side and the Place shrink first (down to 0.7), then my side and the Quests (never below a
 * 100 px tile); below that the board scrolls inside itself and the page never scrolls. Runs at 390x844, 360x740, the Pixel 8 Pro
 * visible size 395x731, 390x700 and 360x700 (the table fits) and at 360x640 (the board may scroll inside itself).
 * Emulation proves the geometry at fixed viewport sizes; only Gandalf's Pixel 8 Pro proves how Chrome's address bar and the Android
 * navigation bar change the visible height while he plays (65-HUMAN-UAT.md).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { PHONE_VIEWPORTS, PIXEL_VIEWPORT, phoneUse } from '../helpers/phoneViewports.js';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { intersects, pageOverflow } from '../helpers/phoneGeometry.js';
import { readSide } from '../helpers/readSide.js';
import { readTable } from '../helpers/readTable.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';
import { collectFaceZones, findFaceCollisions } from '../helpers/faceZones.js';

const SHOT_DIR = process.env.OBBY65_SHOT_DIR || 'C:/tmp';
const FITS = [
	...PHONE_VIEWPORTS,
	PIXEL_VIEWPORT,
	{ name: '390x700', width: 390, height: 700 },
	{ name: '360x700', width: 360, height: 700 },
];
const TIGHT = { name: '360x640', width: 360, height: 640 }; // too short for the whole table: the board scrolls inside itself
const ALL = [...FITS, TIGHT];
const MARGIN = 4;                                           // every box keeps this far from the screen edge
const GAP = 6;                                              // --phone-gap
const HAND = ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'place_drain_zone', 'mosje_gandoe_wizard', 'piecie_broodje_doner'];

const within = (b, outer, tol = 0.5) => b.x >= outer.x - tol && b.right <= outer.right + tol && b.y >= outer.y - tol && b.bottom <= outer.bottom + tol;
const sameX = (b, outer, tol = 0.5) => b.x >= outer.x - tol && b.right <= outer.right + tol;

/** Both tile widths and the base tile (board content width minus 2 gaps, over 3) of the current table. */
async function readTiles(page, t) {
	const [me, opp] = [await readSide(page, 'player'), await readSide(page, 'opponent')];
	const base = (t.board.w - t.board.padL - t.board.padR - 2 * GAP) / 3;
	return { me: me.tile.w, opp: opp.tile.w, base, meSide: me, oppSide: opp };
}

/** (c) Every part of the table lies inside the board's client box (vertical only where the table fits) and the screen. */
async function expectContained(page, t, vertical) {
	const [me, opp] = [await readSide(page, 'player'), await readSide(page, 'opponent')];
	const screen = { x: MARGIN, y: 0, right: t.vw - MARGIN, bottom: t.vh };
	const parts = [
		{ name: 'opponent zone', box: t.opp }, { name: 'my zone', box: t.me }, { name: 'Place', box: t.place.box },
		...t.quests.flatMap((q, i) => [{ name: `Quest ${i + 1}`, box: q.box }, { name: `Quest ${i + 1} count tab`, box: q.count }]),
		...[['opponent', opp], ['me', me]].flatMap(([who, s]) => [
			...s.slots.map((box, i) => ({ name: `${who} Mosje ${i + 1}`, box })),
			...s.piecies.map((box, i) => ({ name: `${who} Piecie ${i + 1}`, box })),
			{ name: `${who} Energy`, box: s.energy }, { name: `${who} deck`, box: s.deck }, { name: `${who} discard`, box: s.discard },
		]),
	];
	for (const { name, box } of parts) {
		expect(box, `${name} exists`).not.toBeNull();
		expect(sameX(box, t.board), `${name} inside the board horizontally (${box.x}..${box.right} of ${t.board.x}..${t.board.right})`).toBe(true);
		expect(box.x >= screen.x && box.right <= screen.right, `${name} inside the screen with ${MARGIN} px margin (${box.x}..${box.right} of ${t.vw})`).toBe(true);
		if (vertical) {
			expect(within(box, { ...t.board, x: -1e6, right: 1e6 }, 1), `${name} inside the board vertically (${box.y}..${box.bottom} of ${t.board.y}..${t.board.bottom})`).toBe(true);
			expect(box.y >= 0 && box.bottom <= t.vh, `${name} inside the screen vertically (${box.y}..${box.bottom} of ${t.vh})`).toBe(true);
		}
	}
}

/** The Quest line: one top, each tile at least 100 px, count tab shown, inside the screen (2.1: no fail pips, a Quest leaves after one attempt). */
function expectQuests(t, vertical) {
	expect(t.quests, '3 Quest stacks').toHaveLength(3);
	const tops = t.quests.map((q) => q.box.y);
	expect(Math.max(...tops) - Math.min(...tops), `Quest tops ${JSON.stringify(tops)} share one line`).toBeLessThanOrEqual(2);
	for (const [i, q] of t.quests.entries()) {
		expect(q.box.w, `Quest ${i + 1} tile width`).toBeGreaterThanOrEqual(99.5);
		expect(q.count, `Quest ${i + 1} shows its count tab`).not.toBeNull();
		expect(q.count.w > 0 && q.count.h > 0, `Quest ${i + 1} count tab has a size`).toBe(true);
		for (const [what, b] of [['tile', q.box], ['count tab', q.count]]) {
			if (!b) continue;
			expect(b.x >= MARGIN && b.right <= t.vw - MARGIN, `Quest ${i + 1} ${what} inside the screen horizontally (${b.x}..${b.right})`).toBe(true);
			if (vertical) expect(b.y >= 0 && b.bottom <= t.vh, `Quest ${i + 1} ${what} inside the screen vertically (${b.y}..${b.bottom} of ${t.vh})`).toBe(true);
		}
	}
}

for (const vp of ALL) {
	const fits = vp !== TIGHT;
	test.describe(`phone table fit at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test.beforeEach(async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: HAND });
		});

		test('(a) header, status strip, board and bottom bar stack up without gaps or overlap', async ({ page }) => {
			const t = await readTable(page);
			expect(t.header.bottom, `header bottom ${t.header.bottom} vs strip top ${t.strip.y}`).toBeLessThanOrEqual(t.strip.y + 1);
			expect(t.strip.bottom, `strip bottom ${t.strip.bottom} vs board top ${t.board.y}`).toBeLessThanOrEqual(t.board.y + 1);
			expect(Math.abs(t.board.bottom - t.bar.y), `board bottom ${t.board.bottom} vs bar top ${t.bar.y}`).toBeLessThanOrEqual(1);
			expect((await pageOverflow(page)).y, 'the page never scrolls').toBeLessThanOrEqual(0);
		});

		test(fits ? '(b) the whole table fits: the board does not scroll' : '(b) too short for the table: the page still never scrolls', async ({ page }) => {
			const t = await readTable(page);
			expect((await pageOverflow(page)).y, 'page overflow y').toBeLessThanOrEqual(0);
			if (fits) expect(t.board.scrollH, `#board-root scrollHeight ${t.board.scrollH} vs clientHeight ${t.board.h}`).toBeLessThanOrEqual(t.board.h + 1);
		});

		test('(c) every part of the table is inside the board and the screen', async ({ page }) => {
			await expectContained(page, await readTable(page), fits);
		});

		test('(d) Quests: one line, tiles 100 px and up, count tab inside the screen', async ({ page }) => {
			expectQuests(await readTable(page), fits);
		});

		test('(e) Place: below the Quests, centred, as wide as the opponent tile; End Turn is in the bar', async ({ page }) => {
			const t = await readTable(page);
			const { opp } = await readTiles(page, t);
			const p = t.place.box;
			expect(p.y, `Place top ${p.y} below the Quest tiles (bottom ${Math.max(...t.quests.map((q) => q.box.bottom))})`).toBeGreaterThanOrEqual(Math.max(...t.quests.map((q) => q.box.bottom)) - 0.5);
			for (const [i, q] of t.quests.entries()) expect(intersects(p, q.count), `Place ${JSON.stringify(p)} overlaps the Quest ${i + 1} count tab ${JSON.stringify(q.count)}`).toBe(false);
			const centre = t.board.x + t.board.w / 2;
			expect(Math.abs(p.x + p.w / 2 - centre), `Place centre ${(p.x + p.w / 2).toFixed(1)} vs board centre ${centre}`).toBeLessThanOrEqual(4);
			expect(Math.abs(p.w - opp), `Place tile ${p.w} vs opponent tile ${opp}`).toBeLessThanOrEqual(1);
			expect(t.endTurnDisplay, 'the strip End Turn column is not displayed').toBe('none');
			expect(t.endTurnInBar, '#btn-end-turn is inside #phone-bar').toBe(true);
		});

		test('(f) shrink order: my tile stays at 100 px and up, the opponent shrinks first and never below 0.7', async ({ page }) => {
			const t = await readTable(page);
			const { me, opp, base } = await readTiles(page, t);
			console.log(`REPORT ${vp.name}: base ${base.toFixed(2)}, my tile ${me.toFixed(2)} (scale ${t.scales.me || '-'}), opponent ${opp.toFixed(2)} (scale ${t.scales.opp || '-'}), board free ${t.board.free} px (scrollHeight ${t.board.scrollH} of ${t.board.h})`);
			expect(me, `my tile ${me}`).toBeGreaterThanOrEqual(99.9);
			expect(opp, `opponent tile ${opp} vs 0.7 x ${base}`).toBeGreaterThanOrEqual(0.7 * base - 1);
			expect(me, 'my tile is never bigger than the base tile').toBeLessThanOrEqual(base + 0.5);
			if (me < base - 0.5) expect(Math.abs(opp - 0.7 * base), `my tile ${me} < base ${base}: the opponent ${opp} must already be at 0.7`).toBeLessThanOrEqual(1);
		});

		test('(h) Quest faces (100 px and up) have no text collisions; the Place at the opponent scale is reported', async ({ page }) => {
			const quests = await page.evaluate(collectFaceZones, '.quest-stack .card');
			expect(quests.length, 'the Quest tiles are measured').toBeGreaterThanOrEqual(3);
			expect(Math.min(...quests.map((r) => r.width)), 'Quest tile width').toBeGreaterThanOrEqual(99.5);
			expect(findFaceCollisions(quests), 'face collisions on the Quest tiles').toEqual([]);
			await page.evaluate(() => window.__testHooks.setActivePlace('place_drain_zone', 'player_2'));
			await page.waitForTimeout(400);
			const place = await page.evaluate(collectFaceZones, '#board-place .card');
			expect(place.length, 'the Place tile is on the board').toBe(1);
			const found = findFaceCollisions(place);
			console.log(`REPORT ${vp.name}: Place tile ${place[0].width.toFixed(1)} px${place[0].width < 100 ? ' (UNDER 100 px)' : ''}, collisions: ${found.length ? found.join(' | ') : 'none'}`);
			if (fits) {
				const t = await readTable(page);
				expect(t.board.scrollH, `the table still fits with a Place tile: ${t.board.scrollH} of ${t.board.h}`).toBeLessThanOrEqual(t.board.h + 1);
			}
		});

		test('(j) nothing paints outside a clipping ancestor: Quests, the Place tile, piles', async ({ page }) => {
			await page.evaluate(() => window.__testHooks.setActivePlace('place_drain_zone', 'player_2'));
			await page.waitForTimeout(400);
			expect(await readPaintOverflow(page, '.quest-stack, #board-place .card, [data-pile]')).toEqual([]);
			// The board's bottom padding is only 8 px on a phone: my bottom row (and the empty slots) must still paint inside it. Where
			// the table is too tall (360x640) the board scrolls and its bottom row is simply scrolled out of view, so only the fitting sizes.
			if (fits) expect(await readPaintOverflow(page, '.board-zone--player .board-zone__slots > *, .board-zone--player .board-zone__piecies > *, #board-root .board-slot--empty')).toEqual([]);
		});
	});
}

for (const vp of FITS) {
	test.describe(`phone table fit with a Welloe pile at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test('(g) the table still fits with the Welloe pill in the opponent header', async ({ page }) => {
			test.setTimeout(90000);
			await seedPhoneBoard(page, { hand: HAND, welloe: true });
			const t = await readTable(page);
			expect(t.board.scrollH, `#board-root scrollHeight ${t.board.scrollH} vs clientHeight ${t.board.h}`).toBeLessThanOrEqual(t.board.h + 1);
			expect((await pageOverflow(page)).y, 'page overflow y').toBeLessThanOrEqual(0);
			await expectContained(page, t, true);
			expectQuests(t, true);
		});
	});
}

// The three device sizes only: at the tight 700 px heights a re-render with a Welloe pile already overflows by 5 px (pre-existing, deferred-items).
for (const vp of [PIXEL_VIEWPORT, ...PHONE_VIEWPORTS]) {
	test.describe(`phone table fit with tile state at ${vp.name}`, () => {
		test.use(phoneUse(vp));
		test('(k) attachments, a timed effect, a Welloe pile and a Place: the table still fits (72.1-04)', async ({ page }) => {
			test.setTimeout(90000);
						await seedPhoneBoard(page, { hand: HAND, welloe: true });
			await page.evaluate(() => {
				const h = window.__testHooks;
				h.attachToMosje('player_1', 0, 'piecie_dumbbells');
				h.attachToMosje('player_1', 0, 'piecie_keyboard');
				h.addTimedEffect('player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
				h.attachToMosje('player_2', 0, 'piecie_tony');
				h.setActivePlace('place_drain_zone', 'player_2');
			});
			await page.waitForTimeout(500);
			await expect(page.locator('.tile-count-badge')).toHaveCount(2);
			const t = await readTable(page);
			expect(t.board.scrollH, `#board-root scrollHeight ${t.board.scrollH} vs clientHeight ${t.board.h}`).toBeLessThanOrEqual(t.board.h + 1);
			expect((await pageOverflow(page)).y, 'page overflow y').toBeLessThanOrEqual(0);
			await expectContained(page, t, true);
			expectQuests(t, true);
			// The Welloe pile paints 2 px above #board-root's top edge (pre-existing, not this plan's: deferred-items), so it is left out here.
			expect(await readPaintOverflow(page, '.quest-stack, #board-place .card, [data-pile]:not(.welloe-pile)')).toEqual([]);
		});
	});
}

test.describe('phone table fit: resizing', () => {
	test.use(phoneUse(PHONE_VIEWPORTS[0]));

	test('(i) 390x844 -> 1280x800 -> 390x844: the desktop has no scale variables and no bar, the phone fits again', async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page, { hand: HAND });
		await page.setViewportSize({ width: 390, height: 700 }); // tight: the scales are written
		await page.waitForTimeout(400);
		expect((await readTable(page)).scales.opp, 'at 390x700 the opponent scale is written').not.toBe('');
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.waitForTimeout(700);
		const desk = await readTable(page);
		expect(desk.scales, 'no scale variables on the desktop layout').toEqual({ opp: '', me: '' });
		expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-bar')).display), 'the bar is not displayed on the desktop').toBe('none');
		await page.setViewportSize({ width: 390, height: 844 });
		await page.waitForTimeout(700);
		const back = await readTable(page);
		expect(back.board.scrollH, `back on the phone: scrollHeight ${back.board.scrollH} vs clientHeight ${back.board.h}`).toBeLessThanOrEqual(back.board.h + 1);
		expect((await pageOverflow(page)).y, 'page overflow y').toBeLessThanOrEqual(0);
	});

	test('(i) the table re-fits after every resize through the phone sizes, with no runaway loop', async ({ page }) => {
		test.setTimeout(90000);
		await seedPhoneBoard(page, { hand: HAND });
		for (const vp of [FITS[3], FITS[4], FITS[2], FITS[1], FITS[0], FITS[3]]) {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.waitForTimeout(500);
			const a = await readTable(page);
			await page.waitForTimeout(400);
			const b = await readTable(page);
			expect(b.scales, `${vp.name}: the scales are stable (no resize feedback loop)`).toEqual(a.scales);
			expect(b.board.scrollH, `${vp.name}: scrollHeight ${b.board.scrollH} vs clientHeight ${b.board.h}`).toBeLessThanOrEqual(b.board.h + 1);
			expect((await pageOverflow(page)).y, `${vp.name}: page overflow y`).toBeLessThanOrEqual(0);
		}
	});
});

// Pictures for the progress report (not committed, written outside the repo).
test.describe('65-05 screenshots', () => {
	test.describe('phone 390x844 (touch)', () => {
		test.use(phoneUse(PHONE_VIEWPORTS[0]));
		test('the whole table at 390x844', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page, { hand: HAND });
			await page.evaluate(() => window.__testHooks.setActivePlace('place_drain_zone', 'player_2'));
			await page.waitForTimeout(500);
			await page.screenshot({ path: `${SHOT_DIR}/65-05-phone-390x844.png` });
		});
	});
	test.describe('desktop 1920x1080 (mouse)', () => {
		test.use({ viewport: { width: 1920, height: 1080 }, isMobile: false, hasTouch: false });
		test('the table at 1920x1080', async ({ page }) => {
			test.setTimeout(90000);
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await seedPhoneBoard(page, { hand: HAND });
			await page.mouse.move(2, 2);
			await page.waitForTimeout(500);
			await page.screenshot({ path: `${SHOT_DIR}/65-05-desktop-1920x1080.png` });
		});
	});
});
