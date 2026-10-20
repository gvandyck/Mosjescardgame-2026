// @ts-nocheck
// 61.1 regression guards from the Phase 61 sweep seeds (reaction-replay holes). Later plans of Phase 61.1 append to this file.
// Engine level, 3 Example Decks: the bot must never make a refused engine call on these seeds.
import { describe, it, expect } from 'vitest';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';

const refusedOf = (game) => game.metrics
	.filter((m) => m.ev === 'engine-refused')
	.map((m) => `${m.call} | ${m.cardId} | ${m.error}`);

// Seed 50349 is shared by the Perfect Dodge refusal guard and the lingering-flag guard: play it once.
let taksenGame;
const taksenVsCreatieve = () => (taksenGame ??= runSeededBotGame({ p1DeckId: 'EXAMPLE_TAKSEN', p2DeckId: 'EXAMPLE_CREATIEVELINGEN', seed: 50349 }));

describe('reaction replay seeds', () => {
	it('Drain Reversal seed 0xB00E (EXAMPLE_CREATIEVELINGEN vs EXAMPLE_REGELAARS) has no refused engine call', () => {
		const game = runSeededBotGame({ p1DeckId: 'EXAMPLE_CREATIEVELINGEN', p2DeckId: 'EXAMPLE_REGELAARS', seed: 0xB00E });
		expect(game.state.status).toBe('FINISHED');
		expect(refusedOf(game)).toEqual([]);
	}, 60000);

	it('Perfect Dodge seed 50349 (EXAMPLE_TAKSEN vs EXAMPLE_CREATIEVELINGEN) has no refused engine call', () => {
		const game = taksenVsCreatieve();
		expect(game.state.status).toBe('FINISHED');
		expect(refusedOf(game)).toEqual([]);
	}, 60000);

	it('a getemt-while-sideways Mosje never lingers (seed 50349)', () => {
		const game = taksenVsCreatieve();
		const lingering = [];
		for (const step of game.steps) {
			for (const pid of Object.keys(step.after.players)) {
				step.after.players[pid].activeSlots.forEach((s, i) => {
					if (s && s._pendingWelloe === true) lingering.push(`turn ${step.turnNumber} ${step.playerId} [${step.label}] ${pid} slot ${i}`);
				});
			}
		}
		expect(lingering).toEqual([]);
	}, 60000);
});
