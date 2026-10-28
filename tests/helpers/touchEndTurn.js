// touchEndTurn.js - Phase 65-09: End Turn by a real tap on the phone bar's button; the "A Mosje can still act" confirm sheet is answered
// by tap when the game asks it (63 D-11). Returns whether the confirm was shown. The touch twin of clickEndTurn.js.

/** @param {import('@playwright/test').Page} page */
export async function touchEndTurn(page) {
	const left = await page.locator('#btn-end-turn').getAttribute('data-actions-left').catch(() => null);
	await page.locator('#btn-end-turn').tap();
	const end = page.locator('.modal-mosje-select-btn[data-id="end"]').first();
	const shown = await end.waitFor({ state: 'visible', timeout: left === '0' ? 250 : 1000 }).then(() => true, () => false);
	if (shown) await end.tap();
	return shown;
}
