// @ts-nocheck
// 61.1 D-03c: the seeded runner counts "Fresh: ... fizzled" log lines (a hostile effect aimed at a fresh Mosje fizzles silently
// in the engine, Phase 61 warning W1) and only an all-targets card (Straffoe) explains them. This file proves the classifier can
// fail (a lone fizzle is unexplained) and that the regexes match the engine's real log lines.
import { describe, it, expect, vi } from 'vitest';
import { ALL_TARGETS_EFFECTS, ALL_TARGETS_LINE, FIZZLE_LINE, classifyTurnLines } from '../helpers/classifyFizzles.js';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { loseMP } from '../../src/engine/mpManager.js';
import { activatePiecie } from '../../src/engine/turnManager.js';
import { MOSJES } from '../../src/data/mosjes.js';

const FIZZLE = '[MP] \u{1F6E1}️ Fresh: Binti — 10 MP loss (DRAIN) fizzled';
const FIZZLE_ENTERED = '[MP] \u{1F6E1}️ Fresh: Binti just entered play — 10 MP loss (DRAIN) fizzled';
const STRAFFOE = '[ENGINE] Piecie activated: Straffoe (effect_straffoe)';

describe('classifyTurnLines', () => {
	it('a lone fizzle line is unexplained', () => {
		const out = classifyTurnLines([FIZZLE]);
		expect(out.explained).toBe(0);
		expect(out.unexplained).toEqual([FIZZLE]);
	});

	it('a fizzle with a Straffoe activation in the same turn is explained', () => {
		const out = classifyTurnLines([FIZZLE, STRAFFOE]);
		expect(out.explained).toBe(1);
		expect(out.unexplained).toEqual([]);
	});

	it('one Straffoe explains at most 2 fizzles: three fizzles leave one unexplained', () => {
		const out = classifyTurnLines([FIZZLE, FIZZLE_ENTERED, FIZZLE, STRAFFOE]);
		expect(out.explained).toBe(2);
		expect(out.unexplained).toHaveLength(1);
	});

	it('a Straffoe activation without a fizzle explains nothing; the order of the lines does not matter', () => {
		expect(classifyTurnLines([STRAFFOE])).toEqual({ explained: 0, unexplained: [] });
		expect(classifyTurnLines([STRAFFOE, FIZZLE]).explained).toBe(1);
	});

	it('an unrelated [MP] or [ENGINE] line is not counted', () => {
		for (const line of ['[MP] loss reduced to 0 — no loss (§2g)', '[MP] Momentum Factory active — ATTACK damage blocked', '[ENGINE] Piecie activated: Affoe (effect_affoe)', '[ENGINE] 📉 Binti loses 10 (DRAIN) → L1 | 30 MP']) {
			expect(FIZZLE_LINE.test(line), line).toBe(false);
			expect(ALL_TARGETS_LINE.test(line), line).toBe(false);
		}
		expect(classifyTurnLines(['[MP] loss reduced to 0 — no loss (§2g)', '[ENGINE] Piecie activated: Affoe (effect_affoe)'])).toEqual({ explained: 0, unexplained: [] });
	});

	it('the all-targets list is exactly Straffoe (Card List line 231)', () => {
		expect(ALL_TARGETS_EFFECTS).toEqual(['effect_straffoe']);
	});
});

describe('runSeededBotGame returns the fizzles of the game', () => {
	// The runner swaps console.log before it calls the preset, so a preset can stand in for a bot that mis-targeted.
	const play = (...lines: string[]) => runSeededBotGame({ p1DeckId: 'EXAMPLE_TAKSEN', p2DeckId: 'EXAMPLE_REGELAARS', seed: 1, maxTurns: 1, preset: () => { lines.forEach((l) => console.log(l)); } });

	it('a fizzle line without an all-targets activation is returned as unexplained, with its turn', () => {
		const game = play(FIZZLE);
		expect(game.fizzles.explained).toBe(0);
		expect(game.fizzles.unexplained).toEqual([`turn 1: ${FIZZLE}`]);
	});

	it('the same fizzle line with a Straffoe activation is returned as explained', () => {
		const game = play(FIZZLE, STRAFFOE);
		expect(game.fizzles).toEqual({ explained: 1, unexplained: [] });
	});

	it('a game without fizzle lines returns zero for both', () => {
		expect(play().fizzles).toEqual({ explained: 0, unexplained: [] });
	});
});

describe('FIZZLE_LINE matches the engine\'s own log line', () => {
	it('loseMP on a fresh Mosje (opponent-sourced) logs a line FIZZLE_LINE matches and the MP stays', () => {
		const def = MOSJES[0];
		const fresh = createMosjeSlot(def, { level: 1, mp: 30 });
		fresh.entryProtected = true;
		const state = makeEngineState({ turnNumber: 3, activePlayerId: 'player_1', players: { player_2: { activeSlots: [fresh, null] } } });
		const lines: string[] = [];
		const spy = vi.spyOn(console, 'log').mockImplementation((...a) => { lines.push(String(a[0])); });
		let after;
		try {
			after = loseMP(state, 'player_2', 0, 10, 'DRAIN', false, 'player_1');
		} finally {
			spy.mockRestore();
		}
		const fizzle = lines.filter((l) => FIZZLE_LINE.test(l));
		expect(fizzle, lines.join('\n')).toHaveLength(1);
		expect(after.players.player_2.activeSlots[0].mp).toBe(30);
		expect(classifyTurnLines(fizzle).unexplained).toEqual(fizzle);
	});

	it('a real Straffoe activation against a fresh Mosje: its fizzle line is explained by its own activation line', () => {
		const state = makePiecieState({ piecieId: 'piecie_straffoe', foeMod: (foe) => { foe.entryProtected = true; } });
		const lines: string[] = [];
		const spy = vi.spyOn(console, 'log').mockImplementation((...a) => { lines.push(String(a[0])); });
		let res;
		try {
			res = activatePiecie(state, 'player_1', 0, { skipReactions: true });
		} finally {
			spy.mockRestore();
		}
		expect(res.success, res.error).toBe(true);
		expect(res.state.players.player_2.activeSlots[0].mp).toBe(50); // the fresh Mosje is untouched
		const matching = lines.filter((l) => FIZZLE_LINE.test(l) || ALL_TARGETS_LINE.test(l));
		expect(matching.filter((l) => FIZZLE_LINE.test(l))).toHaveLength(1);
		expect(matching.filter((l) => ALL_TARGETS_LINE.test(l))).toHaveLength(1);
		expect(classifyTurnLines(matching)).toEqual({ explained: 1, unexplained: [] });
	});

	it('a Mosje that is no longer fresh takes the loss and logs no fizzle line', () => {
		const def = MOSJES[0];
		const slot = createMosjeSlot(def, { level: 1, mp: 30 });
		slot.entryProtected = false;
		const state = makeEngineState({ turnNumber: 3, activePlayerId: 'player_1', players: { player_2: { activeSlots: [slot, null] } } });
		const lines: string[] = [];
		const spy = vi.spyOn(console, 'log').mockImplementation((...a) => { lines.push(String(a[0])); });
		let after;
		try {
			after = loseMP(state, 'player_2', 0, 10, 'DRAIN', false, 'player_1');
		} finally {
			spy.mockRestore();
		}
		expect(lines.filter((l) => FIZZLE_LINE.test(l))).toEqual([]);
		expect(after.players.player_2.activeSlots[0].mp).toBe(20);
	});
});
