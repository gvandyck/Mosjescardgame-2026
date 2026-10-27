/**
 * evaluate-sim-gate.js — the D-26 gate of the 2.0 sim, as pure data so vitest can pin it (T-64-27).
 * The run FAILS on: any crashed game, a lost record (fewer games than expected), or a timeout rate of 25 % or more.
 * Nothing else fails a run (D-27). The caps themselves live in tests/helpers/simCaps.js.
 * records: { matchup, gameIndex, seed, crashed, errors, engineRefused, winReason, timedOut }.
 */

export const MAX_TIMEOUT_RATE = 25;

function firstErrorOf(r) {
	if (r.errors?.length) return r.errors[0];
	if (r.engineRefused > 0) return `engine-refused x${r.engineRefused}`;
	return `invalid win reason ${r.winReason}`;
}

export function evaluateSimGate(records, { expectedGames }) {
	const crashes = records
		.filter(r => r.crashed)
		.map(r => ({ matchup: r.matchup, gameIndex: r.gameIndex, seed: r.seed, firstError: firstErrorOf(r) }));
	const timeoutCount = records.filter(r => r.timedOut).length;
	const timeoutRate = records.length > 0 ? +((timeoutCount / records.length) * 100).toFixed(1) : 0;
	const recorded = records.length;
	const passed = crashes.length === 0 && timeoutRate < MAX_TIMEOUT_RATE && recorded === expectedGames;
	return { crashes, timeoutCount, timeoutRate, recorded, expected: expectedGames, passed };
}
