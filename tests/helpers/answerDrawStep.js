// answerDrawStep.js - Phase 65-09 (D-14): a human turn can open the Draw step prompt right at the start (Coert and friends). If it
// opens within `wait` ms it must be a bottom sheet; "Draw normally" is then tapped. Returns whether it opened. A no-op otherwise.
import { expectBottomSheet } from './expectBottomSheet.js';

/** @param {import('@playwright/test').Page} page @param {{ wait?: number }} [opts] */
export async function answerDrawStep(page, { wait = 1500 } = {}) {
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]').first();
	const opened = await draw.waitFor({ state: 'visible', timeout: wait }).then(() => true, () => false);
	if (!opened) return false;
	await expectBottomSheet(page, 'Draw step');
	await draw.tap();
	await draw.waitFor({ state: 'hidden', timeout: 5000 });
	return true;
}
