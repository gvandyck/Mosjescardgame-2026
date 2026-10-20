// runSeededBotGame.js - one bot-vs-bot game on a seeded Math.random, with every '[BOT] METRIC' line collected.
// Test helper (BOT-01 / BOT-02, shared by 61-08 and 61-09), not a test file.
// runSeededBotGame({ p1DeckId, p2DeckId, seed, preset, maxTurns = 200 })
//   preset(state) may change the opening state (it can return a new state or mutate in place).
//   -> { state, turns, steps, metrics, fizzles }: the final state, the number of turns played, every step as
//      { playerId, turnNumber, before, after, label, action }, every parsed metric ({ ev, ...fields }) and the
//      fresh-Mosje fizzles of the game: { explained: number, unexplained: string[] } (61.1 D-03c). A hostile effect aimed at a
//      fresh Mosje fizzles silently in the engine; those log lines are classified per bot turn by classifyTurnLines
//      (explained = up to 2 per all-targets card activation of that turn; unexplained lines are prefixed `turn N`).
// Math.random and console.log are restored afterwards, also when the game throws.
import { createInitialGameState } from '../../src/engine/gameState.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { ALL_TARGETS_LINE, FIZZLE_LINE, classifyTurnLines } from './classifyFizzles.js';

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
	const fizzles = { explained: 0, unexplained: [] };
	let turnLines = []; // the fizzle / all-targets lines logged since the last classification
	const classifyTurn = () => {
		const out = classifyTurnLines(turnLines);
		fizzles.explained += out.explained;
		fizzles.unexplained.push(...out.unexplained.map((l) => `turn ${turns}: ${l}`));
		turnLines = [];
	};
	let turns = 0;
	let state;
	try {
		Math.random = mulberry32(seed);
		console.log = (...args) => {
			if (typeof args[0] !== 'string') return;
			if (args[0].startsWith(METRIC_PREFIX)) metrics.push(JSON.parse(args[0].slice(METRIC_PREFIX.length)));
			else if (FIZZLE_LINE.test(args[0]) || ALL_TARGETS_LINE.test(args[0])) turnLines.push(args[0]);
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
			classifyTurn();
			if (state.status === 'FINISHED') break;
			state = startTurn(state);
		}
		classifyTurn(); // lines of a last startTurn, if the loop ended on maxTurns
	} finally {
		Math.random = realRandom;
		console.log = realLog;
	}
	return { state, turns, steps, metrics, fizzles };
}
