// questOdds.js — PUBLIC-info estimate of a quest attempt's success chance.
// Mirrors the human roll path (main.js + modalManager.showDiceRoll):
//   d6 + diceBonus >= getQuestDiceThreshold(questDef, mosje)
// plus the cheap requirement gates / auto-successes from questLogic.js.
// The bot never peeks at hidden information here — everything read is
// visible to a human player in the same seat.

import { getQuestDiceThreshold } from '../../abilities/questLogic.js';
import { MOSJES } from '../../data/mosjes.js';

const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

function trait(mosje, name) {
	return Number(mosje?.traits?.[name] || 0);
}

// Requirement gates/auto-successes the odds model must respect. Mirrors the
// quest_req_* functions in questLogic.js (kept tiny; drift is caught by the
// strategy unit tests). Returns { canAttempt, autoSuccess }.
function checkRequirementGate(questDef, mosje, gameState, playerId) {
	const player = gameState?.players?.[playerId];
	switch (questDef?.requirementId) {
		case 'quest_req_momentum_master': {
			const ok = (mosje?.mp || 0) >= 80 && (mosje?.mp || 0) <= 100;
			return { canAttempt: ok, autoSuccess: ok };
		}
		case 'quest_req_speed_run':
			return { canAttempt: (player?.pieciesPlayedThisTurn || 0) < 2, autoSuccess: false };
		case 'quest_req_chain_master':
			return { canAttempt: (player?.pieciesPlayedThisTurn || 0) >= 3, autoSuccess: false };
		case 'quest_req_sustained_assault':
			return { canAttempt: player?.attackPieciePlayedThisTurn === true, autoSuccess: false };
		case 'quest_req_ultimate_challenge': {
			const ok = trait(mosje, 'physical') >= 1 && trait(mosje, 'mental') >= 1 && trait(mosje, 'creative') >= 1;
			return { canAttempt: ok, autoSuccess: false };
		}
		case 'quest_req_artistic_expression': {
			// Attemptable only with Creative ★★+; then it auto-succeeds.
			const ok = trait(mosje, 'creative') >= 2;
			return { canAttempt: ok, autoSuccess: ok };
		}
		// NOTE: the MP-dependent auto-successes in questLogic.js (endure_pain,
		// never_give_up, regelaar, shotje_obby) are NOT modeled as autoSuccess —
		// the live roll path (human modal and rollBotQuestDice) resolves those
		// via getQuestDiceThreshold, so estimating 100% would be optimism the
		// dice don't honor. They fall through to the threshold estimate below.
		case 'quest_req_perfect_sync':
		case 'quest_req_winston_tijd':
			// Field requirements are enforced by canAttemptPersonalQuest;
			// once attemptable, resolveQuest auto-succeeds these.
			return { canAttempt: true, autoSuccess: true };
		default:
			return { canAttempt: true, autoSuccess: false };
	}
}

// Skiffa Place rerolls — same rule as main.js getSkiffaRerolls().
function countSkiffaRerolls(gameState, mosje) {
	if (gameState?.activePlace !== 'place_skiffa') return 0;
	const def = MOSJE_LOOKUP[mosje?.cardId];
	if ((mosje?.subtype || def?.subtype) !== 'ARTISTIC') return 0;
	return trait(mosje, 'creative') >= 3 ? 2 : 1;
}

/**
 * estimateQuestOdds — success-chance estimate for one Mosje attempting one
 * quest. Pass the mosje AS IT WILL BE at roll time (i.e. after the 20 MP
 * attempt cost). Returns:
 *   { canAttempt, autoSuccess, threshold, diceBonus, rerolls, pSuccess }
 */
export function estimateQuestOdds(questDef, mosje, gameState, playerId) {
	const gate = checkRequirementGate(questDef, mosje, gameState, playerId);
	if (!gate.canAttempt) {
		return { canAttempt: false, autoSuccess: false, threshold: null, diceBonus: 0, rerolls: 0, pSuccess: 0 };
	}
	const player = gameState?.players?.[playerId];
	const diceBonus = (gameState?._snelleFlags?.questDiceBonus || 0)
		+ (player?.questPrepBonus || 0)
		+ (gameState?.activePlace === 'place_synergy_chamber' ? 1 : 0);
	if (gate.autoSuccess) {
		return { canAttempt: true, autoSuccess: true, threshold: 1, diceBonus, rerolls: 0, pSuccess: 1 };
	}
	const threshold = getQuestDiceThreshold(questDef, mosje);
	const rerolls = countSkiffaRerolls(gameState, mosje) + (gameState?._rerollGranted ? 1 : 0);
	const effectiveThreshold = threshold - diceBonus;
	const pSingle = Math.min(1, Math.max(0, (7 - effectiveThreshold) / 6));
	const pSuccess = 1 - Math.pow(1 - pSingle, 1 + rerolls);
	return { canAttempt: true, autoSuccess: false, threshold, diceBonus, rerolls, pSuccess };
}
