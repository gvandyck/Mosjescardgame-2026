// @ts-nocheck
// 71-26 (D-39): seeded bot-vs-bot games on the three 2.1 starter decks. The bot plays towards a Personal Quest (Phase 73),
// so a game ends by knockout or Personal Quest; a game that does not finish must have used all its turns. Never a throw, never a refused engine call.
import { describe, it, expect } from 'vitest';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';

const BASE = [['STARTER_PHYSICAL', 'STARTER_DIGITAL'], ['STARTER_DIGITAL', 'STARTER_CREATIVE'], ['STARTER_CREATIVE', 'STARTER_PHYSICAL']];
const SEEDS = Number(process.env.STARTER_SEEDS || 3); // 3 seeds per pairing by default (9 games)
const PAIRS = BASE.flatMap(([a, b], i) => Array.from({ length: SEEDS }, (_, k) => [a, b, 0x71A0 + i * 0x10 + k + 1]));

describe('seeded bot-vs-bot games on the starter decks', () => {
	for (const [a, b, seed] of PAIRS) {
		it(`${a} vs ${b}, seed 0x${seed.toString(16).toUpperCase()}`, () => {
			const game = runSeededBotGame({ p1DeckId: a, p2DeckId: b, seed, maxTurns: 200 });
			const s = game.state;
			console.info(`[STARTER-GAME] ${a} vs ${b} seed 0x${seed.toString(16).toUpperCase()}: ${s.status}, winner=${s.winnerId} (${s.winReason}), ${game.turns} turns, ${game.steps.length} steps`);
			const refused = game.metrics.filter((m) => m.ev === 'engine-refused');
			expect(refused.slice(0, 5).map((m) => `${m.call} | ${m.cardId} | ${m.error}`), `${refused.length} engine-refused`).toEqual([]);
			expect(game.turns).toBeLessThanOrEqual(200);
			if (s.status === 'FINISHED') expect(s.winnerId).toBeTruthy(); else expect(game.turns).toBe(200);
			for (const pid of Object.keys(s.players)) {
				for (const m of s.players[pid].activeSlots || []) {
					if (!m) continue;
					expect(m.mp, `${m.cardId} MP`).toBeGreaterThanOrEqual(0);
					expect(m.mp, `${m.cardId} MP`).toBeLessThanOrEqual(100);
					expect(m.level).toBeGreaterThanOrEqual(1);
					expect(m.level).toBeLessThanOrEqual(3);
					expect((m.attachments || []).length, `${m.cardId} attachments`).toBeLessThanOrEqual(m.cardId === 'mosje_jeffrey' ? 3 : 2);
				}
			}
			if (s.status !== 'FINISHED') { expect(s.pendingChoice).toBeFalsy(); expect(s.pendingDrawStep).toBeFalsy(); }
		}, 120000);
	}
});
