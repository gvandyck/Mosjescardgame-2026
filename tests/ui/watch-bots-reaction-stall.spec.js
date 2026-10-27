/**
 * Watch Bots reaction stall - regression guard (64-04, CLAUDE.md bug workflow).
 *
 * The bug: Watch Bots (bot vs bot) passed humanIds [localPlayerId] to driveBotTurnSteps, but player_1 is a BOT there. When
 * player_2's attack (or Snelle / Piecie) opened a reaction window for player_1, the driver halted with "waits for your
 * reaction" and nobody could answer: playBotSteps only prompts a human window when isOffline, so the loop ran startTurn again for the
 * same player and the window stayed open for good. Measured live before the fix: 8 of the 9 U11 matchups never finished,
 * each stuck on reaction:player_1 for 74 to 119 s.
 *
 * These are three of the (matchup, seed) pairs that stalled (the first two stalled in round 1). The spec fails when any reaction window or pending choice stays open
 * longer than SIM_CAPS.stuckWindowMs, or when the game does not finish. A 60 s wall clock is enough here (these fixed games take 2 to 11 s)
 * and keeps a regression fast to see; the real 80 round / 120 s caps live in U11 (full-game-2.0.spec.js).
 */
import { test, expect } from '@playwright/test';
import { playBotGame } from '../helpers/playBotGame.js';
import { SIM_CAPS } from '../helpers/simCaps.js';

const STALLED = [
	{ name: 'Creatievelingen vs Taksen', deck1: 'EXAMPLE_CREATIEVELINGEN', deck2: 'EXAMPLE_TAKSEN', seed: 6417 },
	{ name: 'Creatievelingen vs Creatievelingen', deck1: 'EXAMPLE_CREATIEVELINGEN', deck2: 'EXAMPLE_CREATIEVELINGEN', seed: 6419 },
	{ name: 'Regelaars vs Regelaars', deck1: 'EXAMPLE_REGELAARS', deck2: 'EXAMPLE_REGELAARS', seed: 6415 },
];

for (const g of STALLED) {
	test(`Watch Bots never waits for a human: ${g.name} (seed ${g.seed})`, async ({ page }) => {
		test.setTimeout(120000);
		const r = await playBotGame(page, { deck1: g.deck1, deck2: g.deck2, seed: g.seed, caps: { ...SIM_CAPS, wallClockMs: 60000 } });
		const summary = JSON.stringify({ ...r, errors: r.errors.slice(0, 3), metrics: undefined });
		expect(r.stuckMs, `a window stayed open on ${r.stuckWhat}: ${summary}`).toBeLessThan(SIM_CAPS.stuckWindowMs);
		expect(r.timedOut, summary).toBe(false);
		expect(r.errors, summary).toEqual([]);
	});
}
