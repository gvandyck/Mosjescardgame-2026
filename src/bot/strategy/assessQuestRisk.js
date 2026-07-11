// assessQuestRisk.js — Should this Mosje attempt this quest right now?
// Combines the odds estimate with what failure/success would actually mean
// for the game, shifted by the deck profile's risk tolerance.
//
// Severity of a failed roll (after the 20 MP attempt cost is paid):
//   'none'    — quest has no failure penalty.
//   'safe'    — penalty lands but MP stays at 0 or above (exactly-0 survives).
//   'regress' — Mosje would drop below 0 but has a Level to lose.
//   'defeat'  — Level-0 Mosje would be defeated, but the bot has a backup.
//   'fatal'   — losing this Mosje likely loses the game (no backup on field
//               or in own hand — own hand is the bot's legal knowledge).

import { estimateQuestOdds } from './questOdds.js';

export const QUEST_ATTEMPT_COST = 20;

// Minimum success chance demanded per failure severity (neutral profile).
const REQUIRED_P = { none: 0.15, safe: 0.35, regress: 0.55, defeat: 0.7, fatal: 0.85 };

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

function hasBackupMosje(gameState, playerId, slotIndex) {
	const player = gameState?.players?.[playerId];
	if (!player) return false;
	const otherActive = (player.activeSlots || [])
		.some((s, i) => i !== slotIndex && s && !s.isDefeated);
	if (otherActive) return true;
	return (player.hand || []).some(c => c.type === 'MOSJE');
}

/**
 * classifyLossSeverity — how bad would losing `lossAmount` MP be for a Mosje
 * currently holding `mpBefore` MP at `level`? Shared by quest-risk assessment
 * and any other "should I take this MP risk" decision (e.g. a gamble ability)
 * — same five-tier vocabulary as the module docstring above.
 */
export function classifyLossSeverity({ mpBefore, level, lossAmount, gameState, playerId, slotIndex }) {
	if (lossAmount <= 0) return 'none';
	if (mpBefore - lossAmount >= 0) return 'safe';
	if ((level || 0) > 0) return 'regress';
	return hasBackupMosje(gameState, playerId, slotIndex) ? 'defeat' : 'fatal';
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
	if ((mosje.mp ?? 0) < QUEST_ATTEMPT_COST) {
		return { ...base, attempt: false, reason: 'cannot-afford-cost' };
	}

	// Evaluate on the MP the Mosje will hold when the die is rolled.
	const mpAtRoll = mosje.mp - QUEST_ATTEMPT_COST;
	const odds = estimateQuestOdds(questDef, { ...mosje, mp: mpAtRoll }, gameState, playerId);
	if (!odds.canAttempt) {
		return { ...base, attempt: false, reason: 'requirement-not-met' };
	}

	const successMP = questSuccessMP(questDef);
	const levelsUp = mpAtRoll + successMP >= 100;
	const winsGame = levelsUp && (mosje.level || 0) >= 2;
	if (odds.autoSuccess) {
		return { ...base, attempt: true, reason: 'auto-success', pSuccess: 1, levelsUp, winsGame };
	}

	const failAmount = questFailAmount(questDef);
	const severity = classifyLossSeverity({
		mpBefore: mpAtRoll, level: mosje.level, lossAmount: failAmount, gameState, playerId, slotIndex,
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
