// assessQuestRisk.js — loss-severity vocabulary shared by risk decisions (Phase 56-05).
// The V4 per-Quest attempt-or-skip model is gone: chooseMosjeAction decides the 2.0
// attack-or-Quest question. These two helpers still judge fixed-odds gambles (Risk and Reward).
//
// Severity of a failed roll (trying a Quest costs no MP in 2.0):
//   'none'    — quest has no failure penalty.
//   'safe'    — penalty lands but MP stays above 0 (2.0: reaching 0 is getemt).
//   'regress' — getemt of a Level 2-3 Mosje: drops one Level, back to 50 MP.
//   'sideways'— getemt of an upright Level 1 Mosje: MP 0, sits out a turn.
//   'fatal'   — getemt of an already-sideways Mosje: it goes to the Welloe pile.

// Minimum success chance demanded per failure severity (neutral profile).
const REQUIRED_P = { none: 0.15, safe: 0.35, regress: 0.55, sideways: 0.7, fatal: 0.85 };

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
