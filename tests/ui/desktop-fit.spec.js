/**
 * desktop-fit.spec.js - Phase 65-02 (MOB-08, D-03, D-19 f): the desktop table FITS a short laptop window.
 * At 1280x800, 1440x900 and 1536x864 the board content is no taller than the board (no inner vertical scroll), the player row
 * and every pile end above the visible hand, nothing scrolls sideways, tiles stay at least 100 px wide at the 240:176 aspect and
 * nothing the board paints is clipped. Found by 63 / 64.1: --field-tile-w was floored at 170 px even where the height budget
 * asked for about 120 px, so the three rows were taller than the board (scrollHeight 491 vs clientHeight 404 at 1280x800).
 * Mouse context, no touch. The 1920x1080 / 1920x950 numbers are locked by desktop-layout-lock.spec.js.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';
import { readPaintOverflow } from '../helpers/paintOverflow.js';
import { setEnergy } from './helpers.js';

const VIEWPORTS = [
	{ width: 1280, height: 800 },
	{ width: 1440, height: 900 },
	{ width: 1536, height: 864 },
];
const HAND = ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost'];
const SHOT_DIR = 'C:/tmp';

test.use({ reducedMotion: 'reduce' });

/** Seed the full board at a viewport and park the mouse so no hover lift or hand raise is in play. */
async function loadFit(page, viewport, { welloe = false } = {}) {
	await page.setViewportSize(viewport);
	await seedPhoneBoard(page, { hand: HAND, energy: 6 });
	if (welloe) {
		await page.evaluate(() => window.__testHooks.injectWelloeMosje('player_2', 'mosje_binti'));
		await setEnergy(page, 'player_1', 5); // re-renders the board with the 8th column
		await page.waitForTimeout(300);
	}
	await page.mouse.move(2, 2);
	await page.waitForTimeout(800);
}

/** What the fit is judged on, read in the page. */
function readFit(page) {
	return page.evaluate(() => {
		const board = document.getElementById('board-root');
		const playerRow = document.querySelector('.board-zone--player .board-zone__row');
		const bottoms = [playerRow.getBoundingClientRect().bottom];
		for (const pile of document.querySelectorAll('[data-pile]')) {
			const r = pile.getBoundingClientRect();
			if (r.width > 0 && r.height > 0) bottoms.push(r.bottom);
		}
		const wraps = [...document.querySelectorAll('.hand-card-wrap')].filter((el) => el.getBoundingClientRect().width > 0);
		const tiles = [...document.querySelectorAll('[data-zone="player"] [data-slot-kind="mosje"], [data-zone="player"] [data-slot-kind="piecie"]')].map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
		return {
			scrollHeight: board.scrollHeight,
			clientHeight: board.clientHeight,
			lowestBottom: Math.max(...bottoms),
			handTop: Math.min(...wraps.map((el) => el.getBoundingClientRect().top)),
			handCards: wraps.length,
			rowScrollW: playerRow.scrollWidth,
			rowClientW: playerRow.clientWidth,
			docScrollW: document.documentElement.scrollWidth,
			innerW: window.innerWidth,
			tiles,
			fieldTileW: parseFloat(getComputedStyle(board.firstElementChild).getPropertyValue('--field-tile-w')),
		};
	});
}

/** The vertical fit, shared by every variant: no inner scroll and the hand never covers the player row or a pile. */
function expectFits(f, label) {
	console.log(`[65-02 fit] ${label}: tile ${Math.round(f.fieldTileW * 10) / 10}px, board ${f.scrollHeight}/${f.clientHeight}, lowest bottom ${Math.round(f.lowestBottom)} vs hand top ${Math.round(f.handTop)}`);
	expect(f.handCards, `${label}: the hand is visible`).toBeGreaterThan(0);
	expect(f.scrollHeight, `${label}: board scrollHeight ${f.scrollHeight} vs clientHeight ${f.clientHeight} (tile ${f.fieldTileW}px)`).toBeLessThanOrEqual(f.clientHeight + 1);
	expect(f.lowestBottom, `${label}: lowest row / pile bottom ${f.lowestBottom} vs top of the visible hand ${f.handTop}`).toBeLessThanOrEqual(f.handTop);
}

for (const viewport of VIEWPORTS) {
	const label = `${viewport.width}x${viewport.height}`;

	test(`desktop fit at ${label}`, async ({ page }) => {
		test.setTimeout(90000);
		await loadFit(page, viewport);
		const f = await readFit(page);
		expectFits(f, label);

		expect(f.docScrollW, `${label}: no page sideways scroll`).toBeLessThanOrEqual(f.innerW);
		expect(f.rowScrollW, `${label}: the player row needs no sideways scroll`).toBeLessThanOrEqual(f.rowClientW + 1);
		expect(f.tiles.length, `${label}: 5 player slots`).toBe(5);
		for (const t of f.tiles) {
			expect(t.w, `${label}: tile width ${t.w}`).toBeGreaterThanOrEqual(100);
			expect(Math.abs(t.w / t.h - 240 / 176) / (240 / 176), `${label}: tile ${t.w}x${t.h} keeps the 240:176 aspect`).toBeLessThanOrEqual(0.01);
		}
		expect(await readPaintOverflow(page, '[data-pile], #board-root .board-slot--empty'), `${label}: no clipped paint`).toEqual([]);

		if (label === '1280x800') {
			fs.mkdirSync(SHOT_DIR, { recursive: true });
			await page.screenshot({ path: `${SHOT_DIR}/65-02-desktop-1280x800.png` });
		}
	});
}

test('desktop fit at 1280x800 with a Welloe pile (8 columns)', async ({ page }) => {
	test.setTimeout(90000);
	await loadFit(page, VIEWPORTS[0], { welloe: true });
	const f = await readFit(page);
	expect(await page.evaluate(() => getComputedStyle(document.getElementById('board-root')).getPropertyValue('--field-slots').trim()), 'the Welloe pile makes 8 columns').toBe('8');
	expectFits(f, '1280x800 + Welloe');
});

test('desktop board at 1920x1080 (screenshot)', async ({ page }) => {
	test.setTimeout(90000);
	await loadFit(page, { width: 1920, height: 1080 });
	fs.mkdirSync(SHOT_DIR, { recursive: true });
	await page.screenshot({ path: `${SHOT_DIR}/65-02-desktop-1920x1080.png` });
});
