// expectInFreeBand.js - Phase 65-09 (D-13): a floating box (the action tray, the toast) must sit in the free band of the phone board:
// `side` px clear of both window edges, below the status strip, and ending `gap` px above the bottom bar. Soft assertions, so a red run
// reports every edge. Returns the numbers { box, strip, bar, win } and logs them for the SUMMARY.
import { expect } from '@playwright/test';
import { rectOf } from './phoneGeometry.js';

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} selector the box to judge
 * @param {{ side?: number, gap?: number }} [opts]
 */
export async function expectInFreeBand(page, selector, { side = 0, gap = 0 } = {}) {
	const box = await rectOf(page, selector);
	const strip = await rectOf(page, '#status-strip');
	const bar = await rectOf(page, '#phone-bar');
	const win = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));
	expect(box, `${selector} is on the page`).not.toBeNull();
	console.log(`[65-09] ${selector}: ${JSON.stringify({ box, stripBottom: strip.bottom, barTop: bar.y, win })}`);
	expect.soft(box.x, `${selector} left edge (>= ${side})`).toBeGreaterThanOrEqual(side);
	expect.soft(box.right, `${selector} right edge (<= ${win.w - side})`).toBeLessThanOrEqual(win.w - side);
	expect.soft(box.y, `${selector} top (>= status strip bottom ${strip.bottom})`).toBeGreaterThanOrEqual(strip.bottom);
	expect.soft(box.bottom, `${selector} bottom (<= bar top ${bar.y} - ${gap})`).toBeLessThanOrEqual(bar.y - gap);
	return { box, strip, bar, win };
}
