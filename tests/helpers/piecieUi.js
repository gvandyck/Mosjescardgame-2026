// piecieUi.js — Playwright helper for activating an own Piecie on the real board (not a test file).
export async function activatePiecieOnField(page, cardId) {
	const piecieEl = page.locator(`#piecies-player [data-card-id="${cardId}"]`).first();
	await piecieEl.waitFor({ state: 'visible', timeout: 8000 });
	const activateBtn = piecieEl.locator('button:has-text("Activate")');
	await activateBtn.waitFor({ state: 'visible', timeout: 5000 });
	await activateBtn.click();
	await page.waitForTimeout(600);
}
