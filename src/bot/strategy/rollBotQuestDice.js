// rollBotQuestDice.js — Performs the bot's quest dice roll EXACTLY like the
// human path (main.js runGeneralQuestDiceRoll + modalManager.showDiceRoll):
//   result = d6 + (snelle questDiceBonus + questPrepBonus + Synergy Chamber)
//   success = result >= getQuestDiceThreshold(questDef, mosje)
// One-shot bonuses are consumed the same way the human path consumes them,
// and Skiffa / Tweede Kans rerolls are spent on failed rolls.

import { getQuestDiceThreshold } from '../../abilities/questLogic.js';
import { rollDie } from '../../engine/deckEngine.js';
import { MOSJES } from '../../data/mosjes.js';

const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

function countSkiffaRerolls(state, mosje) {
	if (state?.activePlace !== 'place_skiffa') return 0;
	const def = MOSJE_LOOKUP[mosje?.cardId];
	if ((mosje?.subtype || def?.subtype) !== 'ARTISTIC') return 0;
	return Number(mosje?.traits?.creative || 0) >= 3 ? 2 : 1;
}

/**
 * rollBotQuestDice — rolls for playerId's Mosje in activeSlots[slotIndex].
 * Does NOT pay the 20 MP attempt cost (caller pays it first, like the human
 * flow) and does NOT resolve the quest — it only rolls and consumes flags.
 * Returns { state, didSucceed, roll, threshold, diceBonus }.
 */
export function rollBotQuestDice(gameState, playerId, questDef, slotIndex) {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const mosje = player?.activeSlots?.[slotIndex];

	const threshold = getQuestDiceThreshold(questDef, mosje);
	const snelleBonus = state._snelleFlags?.questDiceBonus || 0;
	const prepBonus = player?.questPrepBonus || 0;
	const placeBonus = state.activePlace === 'place_synergy_chamber' ? 1 : 0;
	const diceBonus = snelleBonus + prepBonus + placeBonus;

	// Consume one-shot bonuses exactly like main.js does at quest time.
	if (snelleBonus) delete state._snelleFlags.questDiceBonus;
	if (prepBonus) player.questPrepBonus = 0;

	let rerolls = countSkiffaRerolls(state, mosje) + (state._rerollGranted ? 1 : 0);
	if (state._rerollGranted) delete state._rerollGranted;

	let roll = rollDie();
	while (roll + diceBonus < threshold && rerolls > 0) {
		rerolls -= 1;
		roll = rollDie();
	}
	const didSucceed = roll + diceBonus >= threshold;
	return { state, didSucceed, roll, threshold, diceBonus };
}
