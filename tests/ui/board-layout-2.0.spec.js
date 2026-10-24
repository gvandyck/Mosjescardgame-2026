/**
 * board-layout-2.0.spec.js - U12: the 2.0 board layout (UI-01, Phase 63-01).
 * At 1920x1080, 1920x1200 and 2560x1440: every row shows 2 Mosje + 3 Piecie slots (dashed outlines when empty), the
 * middle strip is Place | Quests | End Turn, every tile is at least 150 px high, no row overlaps the visible hand,
 * the status strip is reserved above the board and nothing scrolls sideways. A Welloe pile makes the tiles shrink once (8 columns).
 * Mobile-ready rules c + d (63-08): at 1920x1080 and 1280x800 every control (tray chips, Confirm / Cancel, End Turn, pile buttons,
 * badge hit areas) is at least 44x44, and the tray, the status strip and the toast stay inside the screen above the visible hand.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setEnergy, setHand, setMosjeOnField, clearEntryProtection, unlockPiecies,
} from './helpers.js';
import { tapOwnCard, chooseTray, targetTile, cancelSelection, press } from '../helpers/boardTaps.js';

const VIEWPORTS = [
	{ width: 1920, height: 1080 },
	{ width: 1920, height: 1200 },
	{ width: 2560, height: 1440 },
];
const SHOT_DIR = 'tests/ui/screenshots/board-2-0';

async function loadBoard(page, viewport) {
	await seedOfflineSession(page);
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.setViewportSize(viewport);
	await page.mouse.move(2, 2);
	await page.waitForTimeout(700); // hand re-fans and its 0.32s transition settles
}

/** Geometry of the board as the player sees it: [x, y, w, h, right, bottom] boxes, read in the page. */
function readGeometry(page) {
	return page.evaluate(() => {
		const box = (el) => {
			if (!el) return null;
			const b = el.getBoundingClientRect();
			return { x: b.x, y: b.y, w: b.width, h: b.height, right: b.right, bottom: b.bottom };
		};
		const zoneInfo = (side) => {
			const zone = document.querySelector(`[data-zone="${side}"]`);
			const slots = [...zone.querySelectorAll('[data-slot-kind="mosje"], [data-slot-kind="piecie"]')];
			return {
				box: box(zone),
				mosje: zone.querySelectorAll('[data-slot-kind="mosje"]').length,
				piecie: zone.querySelectorAll('[data-slot-kind="piecie"]').length,
				slotHeights: slots.map((el) => el.getBoundingClientRect().height),
			};
		};
		const middle = document.querySelector('[data-zone="middle"]');
		const handTops = [...document.querySelectorAll('.hand-card-wrap .hand-card')].map((el) => el.getBoundingClientRect().top);
		return {
			opponent: zoneInfo('opponent'),
			player: zoneInfo('player'),
			middle: box(middle),
			place: box(middle.querySelector('#board-place')),
			quests: box(middle.querySelector('#quest-stacks')),
			endTurn: box(middle.querySelector('#btn-end-turn')),
			status: box(document.getElementById('status-strip')),
			handTop: Math.min(...handTops),
			handCards: handTops.length,
			fieldSlots: getComputedStyle(document.getElementById('board-root')).getPropertyValue('--field-slots').trim(),
			scrollW: document.documentElement.scrollWidth,
			bodyScrollW: document.body.scrollWidth,
			innerW: window.innerWidth,
		};
	});
}

for (const viewport of VIEWPORTS) {
	const label = `${viewport.width}x${viewport.height}`;

	test(`U12: board layout at ${label}`, async ({ page }) => {
		await loadBoard(page, viewport);
		const g = await readGeometry(page);

		// Each row always shows 2 Mosje + 3 Piecie slots (a tile or a dashed outline).
		for (const side of ['opponent', 'player']) {
			expect(g[side].mosje, `${side} Mosje slots`).toBe(2);
			expect(g[side].piecie, `${side} Piecie slots`).toBe(3);
			for (const h of g[side].slotHeights) expect(h, `${side} tile height`).toBeGreaterThanOrEqual(150);
		}

		// Middle strip: Place (left), Quests (centre), End Turn (right).
		expect(g.place.x).toBeLessThan(g.quests.x);
		expect(g.quests.x).toBeLessThan(g.endTurn.x);
		expect(g.endTurn.w).toBeGreaterThanOrEqual(44);
		expect(g.endTurn.h).toBeGreaterThanOrEqual(44);

		// Order on the table: status strip, opponent, middle, player; nothing overlaps.
		expect(g.status.h, 'status strip is reserved (44)').toBeGreaterThanOrEqual(44);
		expect(g.status.bottom).toBeLessThanOrEqual(g.opponent.box.y + 1);
		expect(g.opponent.box.bottom).toBeLessThanOrEqual(g.middle.y + 1);
		expect(g.middle.bottom).toBeLessThanOrEqual(g.player.box.y + 1);

		// The board reserves the hand's visible height: the player row ends above the top of the hand.
		expect(g.handCards).toBeGreaterThan(0);
		expect(g.player.box.bottom, 'player row bottom vs top of the visible hand').toBeLessThanOrEqual(g.handTop);

		// No horizontal page scroll.
		expect(g.scrollW).toBeLessThanOrEqual(g.innerW);
		expect(g.bodyScrollW).toBeLessThanOrEqual(g.innerW);

		fs.mkdirSync(SHOT_DIR, { recursive: true });
		await page.screenshot({ path: `${SHOT_DIR}/u12-${label}.png` });
	});
}

test('U12: the first Welloe card makes 8 columns and the tiles stay at least 150 px high (1920x1080)', async ({ page }) => {
	await loadBoard(page, VIEWPORTS[0]);
	const before = await readGeometry(page);
	expect(before.fieldSlots).toBe('7');

	await page.evaluate(() => window.__testHooks.injectWelloeMosje('player_2', 'mosje_binti'));
	await setEnergy(page, 'player_1', 3); // re-renders the board
	await page.waitForTimeout(300);
	const after = await readGeometry(page);

	expect(after.fieldSlots).toBe('8');
	for (const side of ['opponent', 'player']) {
		expect(after[side].mosje).toBe(2);
		expect(after[side].piecie).toBe(3);
		for (const h of after[side].slotHeights) expect(h, `${side} tile height with a Welloe pile`).toBeGreaterThanOrEqual(150);
	}
	// Both rows use the same value, so the tiles shrink once and stay equal. The smallest box of a row is an unrotated
	// outline (tiles carry a tiny table-angle rotation that widens their bounding box).
	const smallest = (g, side) => Math.min(...g[side].slotHeights);
	expect(smallest(after, 'player')).toBeLessThan(smallest(before, 'player'));
	expect(Math.abs(smallest(after, 'player') - smallest(after, 'opponent'))).toBeLessThanOrEqual(1);
	expect(after.player.box.bottom).toBeLessThanOrEqual(after.handTop);
});

// ── Mobile-ready rules c + d: the 44 px tap floor and no overlap with the visible hand (63-08) ─────────────────────────────
const TAP_VIEWPORTS = [{ width: 1920, height: 1080 }, { width: 1280, height: 800 }];

/** Seeded board with badges, a ready Piecie and a one-card hand (so the visible hand top is one known card). */
async function seedTapBoard(page, viewport) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	await page.setViewportSize(viewport);
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ming_natural', { mp: 40, level: 1, levelUpProtected: true }); // PROTECTED badge
	await clearEntryProtection(page);
	await setMosjeOnField(page, 'player_1', 1, 'mosje_alyssa_fissa', { mp: 40, level: 1, entryProtected: true }); // FRESH badge
	await page.evaluate(() => window.__testHooks.setPiecieOnField('player_1', 0, 'piecie_broodje_doner', { faceDown: true }));
	await unlockPiecies(page, 'player_1');
	await setHand(page, 'player_1', ['piecie_kannetje_melk']);
	await setEnergy(page, 'player_1', 6);
	await page.waitForTimeout(700); // the hand re-fans and its transition settles
}

/** Elements matching the selector that are smaller than 44 x 44 (a ::after hit area is measured through getComputedStyle). */
async function undersized(page, selector, pseudo = null) {
	return page.evaluate(({ sel, pseudo }) => [...document.querySelectorAll(sel)].map((el) => {
		const r = pseudo ? getComputedStyle(el, pseudo) : el.getBoundingClientRect();
		return { sel, w: Math.round(parseFloat(pseudo ? r.width : r.width)), h: Math.round(parseFloat(pseudo ? r.height : r.height)) };
	}).filter((b) => !(b.w >= 44 && b.h >= 44)), { sel: selector, pseudo });
}

/** A chrome box (tray, strip, toast) must sit fully inside the screen and end above the top of the visible hand. */
async function expectAboveHand(page, selector) {
	const g = await page.evaluate((sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		const handTops = [...document.querySelectorAll('.hand-card-wrap .hand-card')].map((c) => c.getBoundingClientRect().top);
		return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, handTop: Math.min(...handTops), handCards: handTops.length, w: innerWidth, h: innerHeight };
	}, selector);
	expect(g, `${selector} is on the page`).not.toBeNull();
	expect(g.handCards, 'a hand is visible').toBeGreaterThan(0);
	expect(g.x, `${selector} left edge`).toBeGreaterThanOrEqual(0);
	expect(g.y, `${selector} top edge`).toBeGreaterThanOrEqual(0);
	expect(g.right, `${selector} right edge`).toBeLessThanOrEqual(g.w);
	expect(g.bottom, `${selector} bottom edge`).toBeLessThanOrEqual(g.h);
	expect(g.bottom, `${selector} ends above the visible hand`).toBeLessThanOrEqual(g.handTop);
}

for (const viewport of TAP_VIEWPORTS) {
	const label = `${viewport.width}x${viewport.height}`;

	test(`D-21 c/d: tap targets are at least 44 px and the tray, strip and toast clear the hand at ${label}`, async ({ page }) => {
		test.setTimeout(90000);
		await seedTapBoard(page, viewport);

		// At rest: End Turn, the piles and the badge hit areas.
		expect(await undersized(page, '#btn-end-turn'), 'End Turn').toEqual([]);
		expect(await page.locator('[data-pile]').count(), 'piles').toBeGreaterThanOrEqual(4);
		expect(await undersized(page, '[data-pile]'), 'pile buttons').toEqual([]);
		expect(await page.locator('.tile-badge').count(), 'seeded badges').toBeGreaterThanOrEqual(2);
		expect(await undersized(page, '.tile-badge', '::after'), 'badge hit areas (::after)').toEqual([]);
		await expectAboveHand(page, '#status-strip');

		// Tray open on an own Mosje.
		await tapOwnCard(page, 'mosje', 0);
		expect(await page.locator('[data-action-tray] [data-action]').count(), 'tray chips').toBeGreaterThanOrEqual(3);
		expect(await undersized(page, '[data-action-tray] [data-action]'), 'tray chips').toEqual([]);
		await expectAboveHand(page, '[data-action-tray]');
		await expectAboveHand(page, '#status-strip');

		// Preview: Confirm / Cancel live in the strip.
		await chooseTray(page, 'attack');
		await press(targetTile(page, 'player_2:0'));
		await page.locator('#status-strip[data-status-kind="preview"]').waitFor({ timeout: 5000 });
		expect(await undersized(page, '[data-confirm], [data-cancel]'), 'Confirm / Cancel').toEqual([]);
		expect(await page.locator('#status-strip [data-confirm]').count(), 'Confirm is there').toBe(1);
		await expectAboveHand(page, '#status-strip');
		await cancelSelection(page);

		// Toast: tapping the FRESH badge shows its reason; the toast stays on screen above the hand.
		await press(page.locator('#zone-player .tile-badge').first());
		await page.locator('#board-toast').waitFor({ timeout: 3000 });
		await expectAboveHand(page, '#board-toast');
		if (viewport.width === 1280) {
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await page.screenshot({ path: `${SHOT_DIR}/u12-taps-${label}.png` });
		}
	});
}
