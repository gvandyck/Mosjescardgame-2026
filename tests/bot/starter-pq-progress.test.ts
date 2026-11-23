// @ts-nocheck
// 73-05 (NBOT-01): measured guard. Seeded bot-vs-bot games on the three starter decks (same 9 games as
// starter-decks-bot-games.test.ts) must reach Level 3, roll Personal Quests and win some of them.
// Thresholds are the measured values (2 Level 3 games, 2 Personal Quest rolls, 2 Personal Quest wins) minus slack on the wins.
// The seeds are fixed, so the run is deterministic; a flaky run means hidden randomness in the bot.
import { describe, it, expect, beforeAll } from 'vitest';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';

const BASE = [['STARTER_PHYSICAL', 'STARTER_DIGITAL'], ['STARTER_DIGITAL', 'STARTER_CREATIVE'], ['STARTER_CREATIVE', 'STARTER_PHYSICAL']];
const PAIRS = BASE.flatMap(([a, b], i) => Array.from({ length: 3 }, (_, k) => [a, b, 0x71A0 + i * 0x10 + k + 1]));
const MIN_LEVEL3_GAMES = 2;
const MIN_PQ_ROLLS = 2;
const MIN_PQ_WINS = 1;

function maxLevel(game) {
	let max = 0;
	for (const step of game.steps) for (const p of Object.values(step.after.players)) for (const m of p.activeSlots || []) if (m && m.level > max) max = m.level;
	return max;
}

describe('Personal Quest progress on the starter decks', () => {
	let results = [];
	beforeAll(() => {
		results = PAIRS.map(([a, b, seed]) => {
			const game = runSeededBotGame({ p1DeckId: a, p2DeckId: b, seed, maxTurns: 200 });
			const row = {
				a, b, seed, turns: game.turns, winReason: game.state.winReason,
				pqRolls: game.metrics.filter((m) => m.ev === 'personal-quest-roll').length,
				refused: game.metrics.filter((m) => m.ev === 'engine-refused').length,
				maxLevel: maxLevel(game),
			};
			console.info(`[STARTER-PQ] ${a} vs ${b} seed 0x${seed.toString(16).toUpperCase()}: ${row.turns} turns (${Math.ceil(row.turns / 2)} pairs), ${row.winReason}, PQ rolls ${row.pqRolls}, max Level ${row.maxLevel}`);
			return row;
		});
	}, 600000);

	it('plays only legal engine calls', () => {
		expect(results.reduce((n, r) => n + r.refused, 0)).toBe(0);
	});

	it(`reaches Level 3 in at least ${MIN_LEVEL3_GAMES} of the 9 games`, () => {
		expect(results.filter((r) => r.maxLevel >= 3).length).toBeGreaterThanOrEqual(MIN_LEVEL3_GAMES);
	});

	it(`rolls at least ${MIN_PQ_ROLLS} Personal Quests`, () => {
		expect(results.reduce((n, r) => n + r.pqRolls, 0)).toBeGreaterThanOrEqual(MIN_PQ_ROLLS);
	});

	it(`wins at least ${MIN_PQ_WINS} game by PERSONAL_QUEST`, () => {
		expect(results.filter((r) => r.winReason === 'PERSONAL_QUEST').length).toBeGreaterThanOrEqual(MIN_PQ_WINS);
	});
});
