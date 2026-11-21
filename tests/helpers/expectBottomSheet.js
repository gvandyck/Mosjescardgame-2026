// expectBottomSheet.js - Phase 65-09 (D-14): the prompt that is open right now is a phone bottom sheet: its box ends on the bottom edge
// of the window (+-1 px) and sits inside it sideways. Waits for the slide-up to finish first. Soft assertions, returns the numbers.
import { expect } from '@playwright/test';
import { readSheet } from './readSheet.js';

/** @param {import('@playwright/test').Page} page @param {string} label what opened it, for the messages */
export async function expectBottomSheet(page, label) {
	await page.locator('#modal-root .modal-card').first().waitFor({ state: 'visible', timeout: 5000 });
	await page.waitForTimeout(400); // the 220 ms slide-up is over
	const sheet = await readSheet(page);
	console.log(`[65-09] sheet (${label}): bottom ${sheet.bottom} of ${sheet.innerHeight}, ${sheet.left}..${sheet.right} of ${sheet.innerWidth}`);
	expect.soft(Math.abs(sheet.bottom - sheet.innerHeight), `${label}: a bottom sheet ends on the window bottom (bottom ${sheet.bottom} vs ${sheet.innerHeight})`).toBeLessThanOrEqual(1);
	expect.soft(sheet.left, `${label}: sheet inside the window (left)`).toBeGreaterThanOrEqual(0);
	expect.soft(sheet.right, `${label}: sheet inside the window (right)`).toBeLessThanOrEqual(sheet.innerWidth);
	return sheet;
}
