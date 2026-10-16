// redbullUi.js — Playwright helpers for the Redbull specs (not a test file). Redbull (Card List 2.0): one of your Mosjes
// may use its once-per-turn ability one more time this turn, paying its Energy again (slot.extraAbilityUses).
import { playCardFromHand, unlockPiecies, setEnergy, getGameState } from '../ui/helpers.js';
import { activatePiecieOnField } from './piecieUi.js';
import { answerModals } from './answerModals.js';

/** Play Redbull from the hand, make it activatable, activate it (the Mosje picker, if any, takes the first option). */
export async function playAndActivateRedbull(page, { energy = 8 } = {}) {
	await setEnergy(page, 'player_1', energy);
	await playCardFromHand(page, 'piecie_redbull');
	await page.waitForTimeout(400);
	await unlockPiecies(page, 'player_1');
	await activatePiecieOnField(page, 'piecie_redbull');
	await answerModals(page, [], { max: 2, wait: 500 });
	await page.waitForTimeout(300);
}

/** The Mosje's remaining extra ability uses this turn (0 when none). */
export async function extraUses(page, slotIndex = 0) {
	return (await getGameState(page))?.players?.player_1?.activeSlots?.[slotIndex]?.extraAbilityUses ?? 0;
}

/** Player 1's current Energy. */
export async function energyOf(page) {
	return (await getGameState(page))?.players?.player_1?.energy;
}

/** Click a Mosje's ability button and answer every modal it opens (first option each). Returns the clicked labels. */
export async function useAbilityViaUi(page, mosjeId, picks = []) {
	await page.locator(`.mosje-card--owned[data-card-id="${mosjeId}"] .mosje-ability-btn`).click();
	return answerModals(page, picks, { max: 8, wait: 700 });
}
