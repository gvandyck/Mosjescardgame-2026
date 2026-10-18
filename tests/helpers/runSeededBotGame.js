// runSeededBotGame.js - one bot-vs-bot game on a seeded Math.random, with every '[BOT] METRIC' line collected.
// Test helper (BOT-01 / BOT-02, shared by 61-08 and 61-09), not a test file.
// runSeededBotGame({ p1DeckId, p2DeckId, seed, preset, maxTurns = 200 })
//   preset(state) may change the opening state (it can return a new state or mutate in place).
//   -> { state, turns, steps, metrics }: the final state, the number of turns played, every step as
//      { playerId, turnNumber, before, after, label, action } and every parsed metric ({ ev, ...fields }).
// Math.random and console.log are restored afterwards, also when the game throws.
import { createInitialGameState } from '../../src/engine/gameState.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';

const METRIC_PREFIX = '[BOT] METRIC ';

export function mulberry32(seed) {
	return function () {
		seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function runSeededBotGame({ p1DeckId, p2DeckId, seed, preset, maxTurns = 200 }) {
	const realRandom = Math.random;
	const realLog = console.log;
	const metrics = [];
	const steps = [];
	let turns = 0;
	let state;
	try {
		Math.random = mulberry32(seed);
		console.log = (...args) => {
			if (typeof args[0] === 'string' && args[0].startsWith(METRIC_PREFIX)) metrics.push(JSON.parse(args[0].slice(METRIC_PREFIX.length)));
		};
		const players = [
			{ playerId: 'player_1', name: 'BotA', deckId: p1DeckId },
			{ playerId: 'player_2', name: 'BotB', deckId: p2DeckId },
		];
		state = createInitialGameState(players, 'SEEDED_BVB', { firstPlayerId: 'player_1' });
		if (preset) state = preset(state) ?? state;
		state = startTurn(state);
		while (turns < maxTurns && state.status !== 'FINISHED') {
			const input = state;
			const found = driveBotTurnSteps(state, state.activePlayerId, { humanIds: [] });
			let before = input;
			for (const step of found) {
				steps.push({ playerId: input.activePlayerId, turnNumber: input.turnNumber, before, after: step.state, label: step.label, action: step.action });
				before = step.state;
			}
			if (found.length) state = found[found.length - 1].state;
			turns++;
			if (state.status === 'FINISHED') break;
			state = startTurn(state);
		}
	} finally {
		Math.random = realRandom;
		console.log = realLog;
	}
	return { state, turns, steps, metrics };
}
