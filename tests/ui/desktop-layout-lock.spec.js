/**
 * desktop-layout-lock.spec.js - Phase 65 (D-03, D-19 f): the desktop table never moves. Every phone rule lives behind one
 * `max-width: 700px` query, so at 1920x1080 and 1920x950 the layout numbers must stay exactly what they were BEFORE Phase 65.
 * The baseline (desktop-layout-baseline.json) was recorded on the untouched code. Two modes:
 *   - OBBY65_WRITE_BASELINE=1  writes the baseline (only ever done on code with no Phase 65 CSS / HTML edit);
 *   - otherwise                compares to it with a 0.5 px tolerance and fails with a readable diff.
 * It reads NON-rotated containers only (tiles carry a small table-angle rotation, so their bounding boxes are not used; a tile's
 * offsetWidth / offsetHeight ignore the rotation). The phone-only nodes (#phone-bar, #rotate-notice) must not be displayed here.
 */
import fs from 'fs';
import { test, expect } from '@playwright/test';
import { seedPhoneBoard } from '../helpers/phoneBoard.js';

const BASELINE = 'tests/ui/desktop-layout-baseline.json';
const TOLERANCE = 0.5;
const VIEWPORTS = [
	{ name: '1920x1080', width: 1920, height: 1080 },
	{ name: '1920x950', width: 1920, height: 950 },
];
const HAND = ['mosje_alyssa_fissa', 'piecie_kannetje_melk', 'piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost'];

test.use({ reducedMotion: 'reduce' });

/** Read the layout numbers of the non-rotated containers; every rect is { x, y, w, h } rounded to 0.01 px. */
async function readLayout(page) {
	return page.evaluate(() => {
		const n = (v) => Math.round(v * 100) / 100;
		const rect = (el) => {
			if (!el) return null;
			const r = el.getBoundingClientRect();
			return { x: n(r.left), y: n(r.top), w: n(r.width), h: n(r.height) };
		};
		const q = (sel) => document.querySelector(sel);
		const board = q('#board-root');
		const firstZone = q('.game-board > *');
		const zoneStyle = getComputedStyle(firstZone);
		const tile = q('#zone-player [data-zone="mosje"]');
		const hand = [...document.querySelectorAll('.hand-card-wrap')].find((el) => el.getBoundingClientRect().width > 0);
		const stacks = [...document.querySelectorAll('.quest-stack')].map(rect);
		return {
			topbar: rect(q('.game-topbar')),
			statusStrip: rect(q('#status-strip')),
			board: rect(board),
			opponentRow: rect(q('.board-zone--opponent .board-zone__row')),
			playerRow: rect(q('.board-zone--player .board-zone__row')),
			middle: rect(q('.board-middle')),
			place: rect(q('#board-place')),
			questStacks: stacks,
			endTurn: rect(q('#btn-end-turn')),
			handCard: rect(hand),
			fieldTileW: n(parseFloat(zoneStyle.getPropertyValue('--field-tile-w'))),
			bu: n(parseFloat(zoneStyle.getPropertyValue('--bu'))),
			tileOffsetW: tile ? tile.offsetWidth : null,
			tileOffsetH: tile ? tile.offsetHeight : null,
			boardScrollHeight: board.scrollHeight,
			boardClientHeight: board.clientHeight,
			docScrollWidth: document.documentElement.scrollWidth,
			docScrollHeight: document.documentElement.scrollHeight,
		};
	});
}

/** Flatten nested numbers to { 'a.b[0].c': value } so two layouts can be compared number by number. */
function flatten(value, path = '', out = {}) {
	if (value === null || typeof value !== 'object') { out[path] = value; return out; }
	for (const [key, inner] of Object.entries(value)) flatten(inner, Array.isArray(value) ? `${path}[${key}]` : (path ? `${path}.${key}` : key), out);
	return out;
}

/** The differences between a baseline and a layout as readable lines; empty = the same within the tolerance. */
function diffLayouts(baseline, now) {
	const a = flatten(baseline);
	const b = flatten(now);
	const lines = [];
	for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
		const was = a[key];
		const is = b[key];
		if (typeof was === 'number' && typeof is === 'number') {
			if (Math.abs(was - is) > TOLERANCE) lines.push(`${key}: baseline ${was} -> now ${is} (${Math.round((is - was) * 100) / 100})`);
		} else if (was !== is) {
			lines.push(`${key}: baseline ${was} -> now ${is}`);
		}
	}
	return lines;
}

for (const vp of VIEWPORTS) {
	test(`desktop layout lock at ${vp.name}`, async ({ page }) => {
		test.setTimeout(90000);
		await page.setViewportSize({ width: vp.width, height: vp.height });
		await seedPhoneBoard(page, { hand: HAND, energy: 6 });
		await page.mouse.move(2, 2);
		await page.waitForTimeout(800);

		// The phone-only nodes (later plans add #phone-bar) must be absent or display: none on a desktop.
		for (const id of ['phone-bar', 'rotate-notice']) {
			const display = await page.evaluate((i) => { const el = document.getElementById(i); return el ? getComputedStyle(el).display : 'absent'; }, id);
			expect(['none', 'absent'], `#${id} is not displayed on the desktop`).toContain(display);
		}

		const layout = await readLayout(page);
		expect(layout.board, 'the board exists').not.toBeNull();
		expect(layout.questStacks.length, 'three Quest stacks').toBe(3);

		if (process.env.OBBY65_WRITE_BASELINE === '1') {
			const all = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
			all[vp.name] = layout;
			fs.writeFileSync(BASELINE, `${JSON.stringify(all, null, '\t')}\n`);
			console.log(`[65 lock] baseline written for ${vp.name}: tile ${layout.fieldTileW}px, board ${layout.board.y}..${layout.board.y + layout.board.h}`);
			return;
		}

		const all = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
		expect(all[vp.name], `a baseline exists for ${vp.name}`).toBeTruthy();
		const diff = diffLayouts(all[vp.name], layout);
		expect(diff, `the desktop layout at ${vp.name} moved (0.5 px tolerance):\n${diff.join('\n')}`).toEqual([]);
	});
}
