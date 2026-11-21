// phoneTurnBoard.js - Phase 65-09: the table of the full phone turn (phone-turn.spec.js). Mine: Alyssa Bulldozer in slot 0 (MP 60, the
// attacker), slot 1 EMPTY (Fissa is raised into it), a ready face-down Broodje Doner in Piecie slot 0 (Activate later), 6 Energy, a
// hand of Fissa + Kannetje Melk. Theirs: Gandoe Wizard in slot 0 (MP 60), slot 1 empty, no hand. A face-up Fighting Quest and forced
// 6s on the dice. Only testMode hooks set the stage (no new hook); every step of the turn is a tap.
import { setMosjeOnField, clearEntryProtection, setHand, setEnergy, setQuestFaceUp, setNextDice, unlockPiecies } from '../ui/helpers.js';

export const FISSA = 'mosje_alyssa_fissa';
export const KANNETJE = 'piecie_kannetje_melk';
export const DONER = 'piecie_broodje_doner'; // Energy 1: "One of your Mosjes gains 35 MP."

/** @param {import('@playwright/test').Page} page the loaded board (after waitForBoard) */
export async function seedPhoneTurnBoard(page) {
	await setMosjeOnField(page, 'player_1', 0, 'mosje_alyssa_bulldozer', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_1', 1, null);
	await setMosjeOnField(page, 'player_2', 0, 'mosje_gandoe_wizard', { mp: 60, level: 1 });
	await setMosjeOnField(page, 'player_2', 1, null);
	await clearEntryProtection(page);
	await page.evaluate((id) => window.__testHooks.setPiecieOnField('player_1', 0, id, { faceDown: true }), DONER);
	await unlockPiecies(page, 'player_1');
	await setHand(page, 'player_1', [FISSA, KANNETJE]);
	await setHand(page, 'player_2', []);
	await setEnergy(page, 'player_1', 6);
	await setQuestFaceUp(page, 'PHYSICAL', 'quest_tough_it_out'); // Steady: one 4+, +25 / -15
	await setNextDice(page, [6, 6, 6, 6, 6, 6]);
	await page.waitForTimeout(600); // the board and the hand settle
}
