// phoneBoard.js - Phase 65: one seeded FULL board for the phone specs and the desktop layout lock: 2 Mosjes and 3 face-up Piecies
// on BOTH sides, the given hand and Energy, no entry protection. Only the testMode hooks set the stage (no new hook); the
// Draw-step prompt that opens a human turn is answered by tap on a touch context and by click otherwise.
import {
	GAME_URL_TEST, seedOfflineSession, waitForBoard, setMosjeOnField, clearEntryProtection, setHand, setEnergy,
} from '../ui/helpers.js';

const MY_MOSJES = ['mosje_alyssa_bulldozer', 'mosje_alyssa_fissa'];
const THEIR_MOSJES = ['mosje_gandoe_wizard', 'mosje_ming_natural'];
const PIECIES = ['piecie_broodje_doner', 'piecie_kannetje_melk', 'piecie_momentum_boost'];

/**
 * Open the offline game with testMode and fill the table. The context decides tap or click (hasTouch).
 * @param {import('@playwright/test').Page} page
 * @param {{ hand?: string[], energy?: number, welloe?: boolean }} [opts] welloe: put Binti on the opponent's Welloe pile
 */
export async function seedPhoneBoard(page, { hand = [], energy = 6, welloe = false } = {}) {
	await seedOfflineSession(page, 'DUO_GANDOE_MICHELLE', 'DUO_COERT_BINTI');
	await page.goto(GAME_URL_TEST);
	await waitForBoard(page);
	const touch = await page.evaluate(() => navigator.maxTouchPoints > 0);
	const draw = page.locator('.modal-mosje-select-btn[data-id="draw"]').first();
	if (await draw.isVisible().catch(() => false)) await (touch ? draw.tap() : draw.click());

	for (let i = 0; i < 2; i++) {
		await setMosjeOnField(page, 'player_1', i, MY_MOSJES[i], { mp: 50, level: 1 });
		await setMosjeOnField(page, 'player_2', i, THEIR_MOSJES[i], { mp: 50, level: 1 });
	}
	await page.evaluate((ids) => {
		ids.forEach((id, i) => {
			window.__testHooks.setPiecieOnField('player_1', i, id, { faceDown: false });
			window.__testHooks.setPiecieOnField('player_2', i, id, { faceDown: false });
		});
	}, PIECIES);
	await clearEntryProtection(page);
	await setHand(page, 'player_1', hand);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', energy);
	await setEnergy(page, 'player_2', energy);
	if (welloe) await page.evaluate(() => window.__testHooks.injectWelloeMosje('player_2', 'mosje_binti'));
	await page.waitForTimeout(700); // the board and the hand settle
}
