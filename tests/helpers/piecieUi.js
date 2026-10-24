// piecieUi.js — Playwright helper for activating an own Piecie on the real board (not a test file).
// 63-06: the tile has no Activate button any more; the helper taps the Piecie and chooses Activate in its action tray.
import { activateByTap } from './boardTaps.js';

export async function activatePiecieOnField(page, cardId) {
	const piecieEl = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await piecieEl.waitFor({ state: 'visible', timeout: 8000 });
	await activateByTap(page, cardId);
	await page.waitForTimeout(300);
}
