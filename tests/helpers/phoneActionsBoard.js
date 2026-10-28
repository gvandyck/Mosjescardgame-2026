// phoneActionsBoard.js - Phase 65-09: the table the phone field-action specs play on. The full phone board (2 Mosjes + 3 Piecies per
// side, 6 Energy, no entry protection), then: my slot 0 Bulldozer (the attacker / Quester), my slot 1 Ming (an activated ability, so
// its tray has all 4 chips), their slot 0 Gandoe (a valid target), their slot 1 Ming FRESH (a dimmed target with a reason), a ready
// face-down Doner in my Piecie slot 0 and a ready face-down Kannetje in slot 2 (the lowest right tile), my Drain Zone Place, a
// face-up Fighting Quest and forced 6s. Only testMode hooks set the stage (no new hook).
import { seedPhoneBoard } from './phoneBoard.js';
import { setMosjeOnField, setQuestFaceUp, setNextDice, unlockPiecies } from '../ui/helpers.js';

export const DONER = 'piecie_broodje_doner';
export const KANNETJE = 'piecie_kannetje_melk';
export const PLACE = 'place_drain_zone';

/** @param {import('@playwright/test').Page} page */
export async function seedActionsBoard(page) {
	await seedPhoneBoard(page, { hand: [], energy: 6 });
	await setMosjeOnField(page, 'player_1', 1, 'mosje_ming_natural', { mp: 40, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, 'mosje_ming_natural', { mp: 40, level: 1, entryProtected: true }); // FRESH: not attackable
	await page.evaluate(({ doner, kannetje, place }) => {
		window.__testHooks.setPiecieOnField('player_1', 0, doner, { faceDown: true });
		window.__testHooks.setPiecieOnField('player_1', 2, kannetje, { faceDown: true });
		window.__testHooks.setActivePlace(place, 'player_1');
	}, { doner: DONER, kannetje: KANNETJE, place: PLACE });
	await unlockPiecies(page, 'player_1');
	await setQuestFaceUp(page, 'FIGHTING', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6, 6, 6, 6]);
	await page.waitForTimeout(500); // the table settles
}
