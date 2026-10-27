/**
 * build-sanity-checks.js — compare the 2.0 sim shape with the desk sim (handoff 6d).
 * REPORT ONLY, balancing parked (D-27): a flagged row says "check for a rules bug", it never fails a run.
 * Desk sim: median about 15 rounds, about 74 % attacks, seat 1 about 55 %. The bands are deliberately wide.
 * Input: stats.overall from aggregateDeckStats. Output: 3 rows { metric, value, desk, low, high, flagged, note }.
 */

const ROWS = [
	{ metric: 'median rounds', key: 'medianRounds', desk: 15, low: 10, high: 20 },
	{ metric: 'attack share %', key: 'attackShare', desk: 74, low: 64, high: 84 },
	{ metric: 'seat 1 win rate %', key: 'seat1WinRate', desk: 55, low: 45, high: 65 },
];

export function buildSanityChecks(overall) {
	return ROWS.map(({ metric, key, desk, low, high }) => {
		const value = overall?.[key] ?? null;
		const flagged = typeof value === 'number' && (value < low || value > high);
		return { metric, value, desk, low, high, flagged, note: flagged ? 'check for a rules bug' : 'in line' };
	});
}
