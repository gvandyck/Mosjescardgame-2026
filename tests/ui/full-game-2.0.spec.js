/**
 * U11 - full 2.0 games, one bot-vs-bot game per ordered matchup of the 3 Example Decks (handoff 6c).
 *
 * D-23: "every pairing" = 9 ordered matchups (3 distinct pairings in both seat orders + 3 mirrors).
 * D-24: fast=true, testMode=true; pass = #reward-overlay with a valid win reason (LEVEL_3 or KNOCKOUT), no pageerror,
 *       no console error, no engine-refused bot metric.
 * D-26: the engine has no turn cap, so the harness caps a game at 80 rounds or 120 s wall clock (tests/helpers/simCaps.js).
 *
 * Seeds are fixed per matchup (6411 + index) so a failure is reproducible. A stall, crash or console error is never
 * handled by changing a seed. Shared harness: tests/helpers/playBotGame.js (the 64-06 simulation reuses it).
 */
import { test, expect } from '@playwright/test';
import { EXAMPLE_DECKS } from '../../src/data/exampleDecks.js';
import { playBotGame } from '../helpers/playBotGame.js';

const MATCHUPS = [];
for (const p1 of EXAMPLE_DECKS) for (const p2 of EXAMPLE_DECKS) MATCHUPS.push([p1, p2]);

MATCHUPS.forEach(([p1, p2], i) => {
	test(`U11: ${p1.name} vs ${p2.name} plays to an end`, async ({ page }) => {
		test.setTimeout(200000);
		const seed = 6411 + i;
		const r = await playBotGame(page, { deck1: p1.id, deck2: p2.id, seed });
		const summary = JSON.stringify({ ...r, errors: r.errors.slice(0, 3), metrics: undefined });
		console.log(`U11 ${p1.name} vs ${p2.name} (seed ${seed}): ${r.rounds} rounds, ${(r.elapsedMs / 1000).toFixed(1)} s, `
			+ `winner ${r.winnerId} by ${r.winReason}, stuck ${r.stuckMs} ms ${r.stuckWhat ?? ''}`);
		expect(r.timedOut, summary).toBe(false);
		expect(['LEVEL_3', 'KNOCKOUT'], summary).toContain(r.winReason);
		expect(r.errors, summary).toEqual([]);
		expect(r.engineRefused, summary).toBe(0);
	});
});
