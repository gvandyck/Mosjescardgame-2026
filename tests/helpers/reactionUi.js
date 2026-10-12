// reactionUi.js - Playwright helpers for the human reaction prompt (not a test file).
const promptLocator = (page) => page.locator('.modal-card', { hasText: 'Reaction' });

/** Wait for the 'Reaction' modal and click a Snelle card id, or '__pass__'. */
export async function answerReaction(page, cardIdOrPass) {
	await promptLocator(page).first().waitFor({ state: 'visible', timeout: 8000 });
	await page.locator(`.modal-mosje-select-btn[data-id="${cardIdOrPass}"]`).click();
	await page.waitForTimeout(400);
}

/** Assert that no Reaction prompt shows up (waits a moment so the bot step has played). */
export async function expectNoReactionPrompt(page, ms = 2500) {
	await page.waitForTimeout(ms);
	if (await promptLocator(page).first().isVisible().catch(() => false)) throw new Error('A Reaction prompt appeared but none was expected');
}
