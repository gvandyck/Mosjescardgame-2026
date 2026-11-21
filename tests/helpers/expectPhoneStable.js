// expectPhoneStable.js - Phase 65-09 (D-19 b): the checks the full phone turn repeats after every step: the page never scrolls sideways
// and the bottom bar is on screen (unless a sheet is open: then the sheet is meant to cover the bottom). Soft assertions.
import { expect } from '@playwright/test';
import { pageOverflow, rectOf } from './phoneGeometry.js';

/** @param {import('@playwright/test').Page} page @param {string} label the step, for the messages */
export async function expectPhoneStable(page, label) {
	const over = await pageOverflow(page);
	expect.soft(over.x, `${label}: no sideways page overflow (${over.x})`).toBeLessThanOrEqual(0);
	if ((await page.locator('#modal-root .modal-card').count()) > 0) return;
	const bar = await rectOf(page, '#phone-bar');
	const height = await page.evaluate(() => window.innerHeight);
	await expect.soft(page.locator('#phone-bar'), `${label}: the bottom bar is visible`).toBeVisible();
	expect.soft(!!bar && bar.y >= 0 && bar.bottom <= height + 1, `${label}: the bottom bar is inside the window ${JSON.stringify(bar)}`).toBe(true);
}
