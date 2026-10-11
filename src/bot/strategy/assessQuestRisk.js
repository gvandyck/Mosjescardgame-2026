// assessQuestRisk.js — Should this Mosje attempt this quest right now?
// Combines the odds estimate with what failure/success would actually mean
// for the game, shifted by the deck profile's risk tolerance.
//
// Severity of a failed roll (trying a Quest costs no MP in 2.0):
//   'none'    — quest has no failure penalty.
//   'safe'    — penalty lands but MP stays above 0 (2.0: reaching 0 is getemt).
//   'regress' — getemt of a Level 2-3 Mosje: drops one Level, back to 50 MP.
//   'sideways'— getemt of an upright Level 1 Mosje: MP 0, sits out a turn.
//   'fatal'   — getemt of an already-sideways Mosje: it goes to the Welloe pile.

import { estimateQuestOdds } from './questOdds.js';
import { getPartnerSynergyQuestBonus } from '../../abilities/questLogic.js';

// Minimum success chance demanded per failure severity (neutral profile).
const REQUIRED_P = { none: 0.15, safe: 0.35, regress: 0.55, sideways: 0.7, fatal: 0.85 };

function questFailAmount(questDef) {
	const effects = questDef?.onFailure || [];
	const fromEffects = effects
		.filter(e => e.primitive === 'loseMP' && e.params?.amount)
		.reduce((sum, e) => sum + Math.abs(e.params.amount), 0);
	if (fromEffects > 0) return fromEffects;
	return Math.abs(typeof questDef?.failMP === 'number' ? questDef.failMP : 0);
}

function questSuccessMP(questDef) {
	const effects = questDef?.onSuccess || [];
	const fromEffects = effects
		.filter(e => e.primitive === 'gainMP' && e.params?.amount)
		.reduce((sum, e) => sum + e.params.amount, 0);
	if (fromEffects > 0) return fromEffects;
	return questDef?.successMP ?? 0;
}

/**
 * classifyLossSeverity — how bad would losing `lossAmount` MP be for a Mosje
 * currently holding `mpBefore` MP at `level`? Shared by quest-risk assessment
 * and any other "should I take this MP risk" decision (e.g. a gamble ability)
 * — same five-tier vocabulary as the module docstring above.
 */
export function classifyLossSeverity({ mpBefore, level, lossAmount, sideways = false }) {
	if (lossAmount <= 0) return 'none';
	if (mpBefore - lossAmount > 0) return 'safe';
	if ((level || 1) > 1) return 'regress';
	return sideways === true ? 'fatal' : 'sideways';
}

/**
 * getRequiredConfidence — minimum success probability demanded for a
 * `severity`-tier risk, shifted by the deck profile's risk tolerance and
 * whether the payoff would level up / win the game. Shared so a fixed-odds
 * gamble (e.g. a fifty-fifty ability) can be judged by the same standard as
 * a quest roll — just compare its actual odds against this threshold.
 */
export function getRequiredConfidence(severity, profile, { winsGame = false, levelsUp = false } = {}) {
	let requiredP = REQUIRED_P[severity];
	requiredP -= ((profile?.riskTolerance ?? 0.5) - 0.5) * 0.3; // ±0.15 swing
	if (winsGame) requiredP -= 0.25;       // success ends the game — lean in
	else if (levelsUp) requiredP -= 0.1;   // permanent progress is worth risk
	return Math.max(requiredP, severity === 'fatal' ? 0.34 : 0.1);
}

/**
 * assessQuestRisk — decision + reasoning for one (quest, mosje slot) pair.
 * Returns { attempt, reason, pSuccess, requiredP, severity, levelsUp, winsGame }.
 */
export function assessQuestRisk({ questDef, mosje, slotIndex, gameState, playerId, profile }) {
	const base = { pSuccess: 0, requiredP: null, severity: null, levelsUp: false, winsGame: false };
	if (!questDef || !mosje || mosje.isDefeated) {
		return { ...base, attempt: false, reason: 'no-mosje' };
	}
	if (mosje.sideways === true) {
		return { ...base, attempt: false, reason: 'sideways' };
	}

	// Evaluate on the MP the Mosje will hold when the die is rolled.
	const mpAtRoll = mosje.mp;
	const odds = estimateQuestOdds(questDef, { ...mosje, mp: mpAtRoll }, gameState, playerId);
	if (!odds.canAttempt) {
		return { ...base, attempt: false, reason: odds.gateReason || 'requirement-not-met' };
	}

	// Include bonus MP the engine will actually add on success (the one-shot
	// questBonusMP flag, plus any live partner-synergy bonus e.g. West+Cless)
	// so a marginal quest that only clears 100 MP WITH the bonus is still
	// correctly judged as "levels up" — reuses the exact function resolveQuest
	// calls, so the two can never drift out of sync.
	const successMP = questSuccessMP(questDef)
		+ (gameState?.players?.[playerId]?.questBonusMP || 0)
		+ getPartnerSynergyQuestBonus(gameState, playerId, questDef?.category, mosje.cardId);
	const levelsUp = mpAtRoll + successMP >= 100;
	// Obby 2.0: reaching Level 3 never wins on the spot (you must hold it to your next
	// turn), so a Quest never 'wins the game'. Phase 61 (BOT-01 'protect a Level 3') adds the real signal.
	const winsGame = false;
	if (odds.autoSuccess) {
		return { ...base, attempt: true, reason: 'auto-success', pSuccess: 1, levelsUp, winsGame };
	}

	const failAmount = questFailAmount(questDef);
	const severity = classifyLossSeverity({
		mpBefore: mpAtRoll, level: mosje.level, lossAmount: failAmount, sideways: mosje.sideways,
	});
	const requiredP = getRequiredConfidence(severity, profile, { winsGame, levelsUp });

	const attempt = odds.pSuccess >= requiredP;
	return {
		attempt,
		reason: attempt ? 'odds-acceptable' : 'too-risky',
		pSuccess: +odds.pSuccess.toFixed(3),
		requiredP: +requiredP.toFixed(3),
		severity,
		levelsUp,
		winsGame,
	};
}
