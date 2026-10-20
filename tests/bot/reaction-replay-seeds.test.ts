// @ts-nocheck
// 61.1 regression guards from the Phase 61 sweep seeds (reaction-replay holes). Later plans of Phase 61.1 append to this file.
// Engine level, 3 Example Decks: the bot must never make a refused engine call on these seeds.
import { describe, it, expect } from 'vitest';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';

const refusedOf = (game) => game.metrics
	.filter((m) => m.ev === 'engine-refused')
	.map((m) => `${m.call} | ${m.cardId} | ${m.error}`);

describe('reaction replay seeds', () => {
	it('Drain Reversal seed 0xB00E (EXAMPLE_CREATIEVELINGEN vs EXAMPLE_REGELAARS) has no refused engine call', () => {
		const game = runSeededBotGame({ p1DeckId: 'EXAMPLE_CREATIEVELINGEN', p2DeckId: 'EXAMPLE_REGELAARS', seed: 0xB00E });
		expect(game.state.status).toBe('FINISHED');
		expect(refusedOf(game)).toEqual([]);
	}, 60000);
});
