// expectTrayChips.js - Phase 65-09 (D-13, D-15, T-65-12): the open tray holds `count` chips, each at least 44 px high and `minW` px wide,
// no two overlap, and the tray itself stays out of the bottom bar. Soft assertions, numbers logged for the SUMMARY.
import { expect } from '@playwright/test';
import { intersects, rectOf } from './phoneGeometry.js';
import { readTrayChips } from './readTrayChips.js';

/**
 * @param {import('@playwright/test').Page} page
 * @param {number} count how many chips the tray must hold
 * @param {number} [minW] the narrowest chip allowed (a mis-tap needs a gap AND a body)
 */
export async function expectTrayChips(page, count, minW = 72) {
	const chips = await readTrayChips(page);
	console.log(`[65-09] chips: ${JSON.stringify(chips.map((c) => `${c.action} ${c.w}x${c.h}@${c.x},${c.y}`))}`);
	expect(chips.length, 'the tray chips').toBe(count);
	for (const c of chips) {
		expect.soft(c.h, `${c.action} chip height >= 44`).toBeGreaterThanOrEqual(44);
		expect.soft(c.w, `${c.action} chip width >= ${minW}`).toBeGreaterThanOrEqual(minW);
	}
	for (let i = 0; i < chips.length; i++) {
		for (let j = i + 1; j < chips.length; j++) {
			expect.soft(intersects(chips[i], chips[j]), `chips ${chips[i].action} and ${chips[j].action} must not overlap`).toBe(false);
		}
	}
	const [tray, bar] = [await rectOf(page, '[data-action-tray]'), await rectOf(page, '#phone-bar')];
	expect.soft(intersects(tray, bar), 'the tray must not touch the bottom bar').toBe(false);
	return chips;
}
