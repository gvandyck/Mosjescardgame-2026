// clickEndTurn.js — Playwright helper (not a test file): click End Turn and answer the "A Mosje can still act: end turn anyway?"
// confirm when the game asks it (63-07, D-11). The game asks only while a Mosje can still attack or Quest, so a board with nothing
// left ends at once. data-actions-left on #btn-end-turn tells how long to look for the confirm (it opens right after the click).

/** Click End Turn; if the confirm shows, press "End turn". Returns true when the confirm was shown and answered. */
export async function clickEndTurn(page) {
	const left = await page.locator('#btn-end-turn').getAttribute('data-actions-left').catch(() => null);
	await page.click('#btn-end-turn');
	const end = page.locator('.modal-mosje-select-btn[data-id="end"]').first();
	const shown = await end.waitFor({ state: 'visible', timeout: left === '0' ? 250 : 1000 }).then(() => true, () => false);
	if (shown) await end.click();
	return shown;
}
