// shouldUseAbility - should the bot press the ability button of its Mosje in `slotIndex` now? (BOT-02: moved out of
// botDriver.js.) The Energy gate is the REAL price: Place discounts (Welloe Graveyard) plus the Delluft parking fee,
// with `reserve` Energy kept back. Timing, once-per-turn and "can it act" stay with the caller; this is only the gate.
import { MOSJES } from '../../data/mosjes.js';
import { getStrikeCandidates } from '../../abilities/mosje/getStrikeCandidates.js';
import { asBotView } from './asBotView.js';
import { canBotAfford } from './canBotAfford.js';
import { classifyLossSeverity, getRequiredConfidence } from './assessQuestRisk.js';
import { emitBotMetric } from './emitBotMetric.js';

const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m]));

// AZN Cless - Risk and Reward: a manually-triggered d6 gamble, even -> +25 MP, odd -> -15 MP, fixed 50% odds. Reuse the
// severity/confidence vocabulary of quest risk so the bot only skips the flip when a real loss would be a real problem.
const RISK_REWARD_LOSS = 15;
function shouldUseRiskReward(slot, profile) {
	const severity = classifyLossSeverity({
		mpBefore: slot.mp || 0,
		level: slot.level,
		lossAmount: RISK_REWARD_LOSS,
		sideways: slot.sideways,
	});
	return 0.5 >= getRequiredConfidence(severity, profile); // fixed odds - either side of the coin is equally likely
}

// Elimination Strike (once per game): only when it sets up the knockout (opponent down to one Mosje) or removes a leveled threat.
function shouldUseEliminationStrike(view, botId, slot) {
	if (slot.abilityUsedThisGame) return false;
	const oppId = Object.keys(view.players).find(id => id !== botId);
	const oppActive = (view.players[oppId]?.activeSlots || []).filter(s => s && !s.isDefeated);
	if (oppActive.length === 0) return false;
	// The strike takes the lowest-level non-fresh Mosje (a tie is settled by the bot's first pick); none = it would be refused.
	if (getStrikeCandidates(view, oppId).length === 0) return false;
	const setsUpKnockout = oppActive.length === 1;
	const removesLeveledThreat = oppActive.some(s => (s.level || 1) >= 2);
	if (setsUpKnockout || removesLeveledThreat) {
		emitBotMetric('elimination-strike', { knockout: setsUpKnockout });
		return true;
	}
	return false;
}

export function shouldUseAbility(state, botId, slotIndex, profile, reserve = 0) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const slot = view.players?.[botId]?.activeSlots?.[slotIndex];
	const abilityId = slot ? MOSJE_LOOKUP[slot.cardId]?.abilityId : null;
	if (!abilityId) return false;
	if (!canBotAfford(view, botId, abilityId, 'ability', reserve)) return false;
	if (abilityId === 'ability_gandoe_destroyer_elimination_strike') return shouldUseEliminationStrike(view, botId, slot);
	if (abilityId === 'ability_azn_cless_risk_reward') return shouldUseRiskReward(slot, profile);
	return true;
}
