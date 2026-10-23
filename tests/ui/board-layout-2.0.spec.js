/**
 * board-layout-2.0.spec.js - U12: the 2.0 board layout (UI-01, Phase 63-01).
 * At 1920x1080, 1920x1200 and 2560x1440: every row shows 2 Mosje + 3 Piecie slots (dashed outlines when empty), the
 * middle strip is Place | Quests | End Turn, every tile is at least 150 px high, no row overlaps the visible hand,
 * the status strip is reserved above the board and nothing scrolls sideways. A Welloe pile makes the tiles shrink once (8 columns).
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { GAME_URL_TEST, seedOfflineSession, waitForBoard, setEnergy } from './helpers.js';

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
