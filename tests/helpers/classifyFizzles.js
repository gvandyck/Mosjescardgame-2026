// classifyFizzles.js - which "Fresh: ... fizzled" log lines of one bot turn are explained by an all-targets card (test helper, not a test).
// A hostile single-target effect aimed at a fresh Mosje fizzles silently in the engine (61.1 D-03c, Phase 61 warning W1), so the
// seeded runner counts those log lines. Only an all-targets card hits every opponent Mosje on purpose, fresh ones included
// (the loss pipeline skips them with a fizzle line); everything else is a bot that mis-targeted.

// Effect ids of cards that hit EVERY opponent Mosje. Each id needs a Card List citation:
//   effect_straffoe - docs/obby-2.0/Obby Card Game 2.0 - Card List.md line 231, "Each opponent Mosje loses 10 MP."
export const ALL_TARGETS_EFFECTS = ['effect_straffoe'];

// applyMpLossToSlot.js: `[MP] <emoji> Fresh: <name> — <n> MP loss (<source>) fizzled`
// mpManager.js loseMP:  `[MP] <emoji> Fresh: <name> just entered play — <n> MP loss (<source>) fizzled`
export const FIZZLE_LINE = /^\[MP\] .*Fresh: .+ \d+ MP loss \(.*\) fizzled$/u;

// turnManager.js activatePiecie: `[ENGINE] Piecie activated: <name> (<effectId>)`, logged after the effect ran.
export const ALL_TARGETS_LINE = new RegExp(`^\\[ENGINE\\] Piecie activated: .+ \\((?:${ALL_TARGETS_EFFECTS.join('|')})\\)$`, 'u');

const MOSJES_PER_SIDE = 2; // an all-targets activation fizzles at most once per fresh opponent Mosje

// lines: the matching console lines (fizzle lines and activation lines, in order) of ONE bot turn.
// -> { explained: number, unexplained: string[] } - explained = min(fizzles, 2 per all-targets activation of that turn).
export function classifyTurnLines(lines) {
	const fizzles = lines.filter((l) => FIZZLE_LINE.test(l));
	const activations = lines.filter((l) => ALL_TARGETS_LINE.test(l)).length;
	const explained = Math.min(fizzles.length, MOSJES_PER_SIDE * activations);
	return { explained, unexplained: fizzles.slice(explained) };
}
