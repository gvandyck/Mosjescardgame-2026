// phoneTileState.js - Phase 72.1-04: the table the phone tile specs read. The full phone board (seedPhoneBoard), then on my slot 0
// (Bulldozer) two attachments and one timed effect, on the opponent's slot 0 (Wizard) one attachment; slot 1 of both sides stays bare.
// Only the testMode hooks set the stage (no new hook).
import { seedPhoneBoard } from './phoneBoard.js';

export const OWN_TILE = '#zone-player [data-zone="mosje"][data-slot-index="0"]';
export const OWN_BARE = '#zone-player [data-zone="mosje"][data-slot-index="1"]';
export const OPP_TILE = '#zone-opponent [data-zone="mosje"][data-slot-index="0"]';
export const OPP_BARE = '#zone-opponent [data-zone="mosje"][data-slot-index="1"]';
export const TIMED_TEXT = '+10 Power until end of next turn';

/** @param {import('@playwright/test').Page} page */
export async function seedTileState(page) {
	await seedPhoneBoard(page, { hand: [], energy: 6 });
	await page.evaluate(() => {
		const h = window.__testHooks;
		h.attachToMosje('player_1', 0, 'piecie_dumbbells');
		h.attachToMosje('player_1', 0, 'piecie_keyboard');
		h.addTimedEffect('player_1', 0, { kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' });
		h.attachToMosje('player_2', 0, 'piecie_tony');
	});
	await page.waitForTimeout(500); // the table settles
}
