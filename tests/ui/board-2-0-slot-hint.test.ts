// @ts-nocheck
// Phase 64.1 (D-06): the slot the board marks is the slot the engine fills.
import { describe, it, expect } from 'vitest';
import { getNextFreeSlot } from '../../src/ui/board/getNextFreeSlot.js';
import { playMosje, playPiecie, playSnellie } from '../../src/engine/turnManager.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const X = createMosjeSlot(MOSJES.find((m) => m.id === 'mosje_gandoe_wizard'));
const P = { cardId: 'piecie_affoe', type: 'PIECIE', faceDown: true, activated: false };

describe('getNextFreeSlot (pure)', () => {
	it('mosje: the first strictly-null index, padded to 2 slots', () => {
		expect(getNextFreeSlot({ activeSlots: [null, X] }, 'mosje')).toBe(0);
		expect(getNextFreeSlot({ activeSlots: [X, null] }, 'mosje')).toBe(1);
		expect(getNextFreeSlot({ activeSlots: [X, X] }, 'mosje')).toBe(-1);
		expect(getNextFreeSlot({ activeSlots: [] }, 'mosje')).toBe(0);
		expect(getNextFreeSlot({ activeSlots: [X] }, 'mosje')).toBe(1);
		expect(getNextFreeSlot({}, 'mosje')).toBe(0);
	});

	it('piecie: the first strictly-null index of 3, arrays and the Firebase object form', () => {
		expect(getNextFreeSlot({ piecieSlots: [P, null, null] }, 'piecie')).toBe(1);
		expect(getNextFreeSlot({ piecieSlots: [null, P, null] }, 'piecie')).toBe(0);
		expect(getNextFreeSlot({ piecieSlots: [P, P, P] }, 'piecie')).toBe(-1);
		expect(getNextFreeSlot({ piecieSlots: [P, P, P, null] }, 'piecie')).toBe(-1);
		expect(getNextFreeSlot({ piecieSlots: { 1: P } }, 'piecie')).toBe(0);
		expect(getNextFreeSlot({ piecieSlots: { 0: P, 1: P } }, 'piecie')).toBe(2);
		expect(getNextFreeSlot({}, 'piecie')).toBe(0);
	});

	it('an unknown kind has no slot, and the player is never changed', () => {
		const player = { activeSlots: [X, null], piecieSlots: { 1: P } };
		const copy = JSON.parse(JSON.stringify(player));
		expect(getNextFreeSlot(player, 'place')).toBe(-1);
		expect(getNextFreeSlot(player, undefined)).toBe(-1);
		getNextFreeSlot(player, 'mosje');
		getNextFreeSlot(player, 'piecie');
		expect(player).toEqual(copy);
	});
});

describe('getNextFreeSlot matches the real engine', () => {
	const FISSA = { cardId: 'mosje_alyssa_fissa', type: 'MOSJE' };
	const DONER = { cardId: 'piecie_broodje_doner', type: 'PIECIE' };
	const DONER_DEF = PIECIES.find((p) => p.id === 'piecie_broodje_doner');

	it.each([
		['[null, null]', [null, null]],
		['[X, null]', [X, null]],
		['[null, X]', [null, X]],
	])('playMosje fills the marked slot for %s', (_name, layout) => {
		const state = makeEngineState({ players: { player_1: { activeSlots: layout, hand: [FISSA] } } });
		const expected = getNextFreeSlot(state.players.player_1, 'mosje');
		const result = playMosje(state, 'player_1', FISSA);
		expect(result.success).toBe(true);
		expect(result.slotIndex).toBe(expected);
		expect(result.state.players.player_1.activeSlots[expected].cardId).toBe('mosje_alyssa_fissa');
	});

	it('a full Mosje row marks nothing and playMosje refuses', () => {
		const state = makeEngineState({ players: { player_1: { activeSlots: [X, X], hand: [FISSA] } } });
		expect(getNextFreeSlot(state.players.player_1, 'mosje')).toBe(-1);
		expect(playMosje(state, 'player_1', FISSA).success).toBe(false);
	});

	it.each([
		['[null, null, null]', [null, null, null]],
		['[P, null, null]', [P, null, null]],
		['[null, P, null]', [null, P, null]],
		['[P, P, null]', [P, P, null]],
	])('playPiecie fills the marked slot for %s', (_name, layout) => {
		const state = makeEngineState({ players: { player_1: { piecieSlots: layout, hand: [DONER] } } });
		const expected = getNextFreeSlot(state.players.player_1, 'piecie');
		const result = playPiecie(state, 'player_1', DONER, DONER_DEF);
		expect(result.success).toBe(true);
		expect(result.state.players.player_1.piecieSlots[expected].cardId).toBe('piecie_broodje_doner');
	});

	it('a full Piecie row marks nothing and playPiecie refuses', () => {
		const state = makeEngineState({ players: { player_1: { piecieSlots: [P, P, P], hand: [DONER] } } });
		expect(getNextFreeSlot(state.players.player_1, 'piecie')).toBe(-1);
		expect(playPiecie(state, 'player_1', DONER, DONER_DEF).success).toBe(false);
	});
});

describe('getNextFreeSlot matches the real playSnellie (64.1-03)', () => {
	// Blensen! stays face-up in its slot until the end of the turn, so the slot it filled can be read back
	// (every other Snelle is discarded the moment it resolves).
	const BLENSEN = { cardId: 'snelle_blensen', type: 'SNELLE_PIECIE' };
	const BLENSEN_DEF = SNELLE_PIECIES.find((c) => c.id === 'snelle_blensen');
	const layouts = [
		['[null, null, null]', [null, null, null]],
		['[P, null, null]', [P, null, null]],
		['[null, P, null]', [null, P, null]],
		['[P, P, null]', [P, P, null]],
	];

	it.each(layouts)('playSnellie fills the marked slot for %s', (_name, layout) => {
		const state = makeEngineState({ players: { player_1: { piecieSlots: layout, hand: [BLENSEN] } } });
		const expected = getNextFreeSlot(state.players.player_1, 'piecie');
		const result = playSnellie(state, 'player_1', BLENSEN, BLENSEN_DEF);
		expect(result.success).toBe(true);
		expect(result.state.players.player_1.piecieSlots[expected].cardId).toBe('snelle_blensen');
		expect(result.state.players.player_1.piecieSlots[expected].type).toBe('SNELLE_PIECIE');
	});

	it.each(layouts)('the same slot on the opponent turn for %s (a Snelle is not turn-bound)', (_name, layout) => {
		const state = makeEngineState({ activePlayerId: 'player_2', players: { player_1: { piecieSlots: layout, hand: [BLENSEN] } } });
		const expected = getNextFreeSlot(state.players.player_1, 'piecie');
		const result = playSnellie(state, 'player_1', BLENSEN, BLENSEN_DEF);
		expect(result.success).toBe(true);
		expect(result.state.players.player_1.piecieSlots[expected].cardId).toBe('snelle_blensen');
	});

	it('a full Piecie row marks nothing and playSnellie refuses', () => {
		const state = makeEngineState({ players: { player_1: { piecieSlots: [P, P, P], hand: [BLENSEN] } } });
		expect(getNextFreeSlot(state.players.player_1, 'piecie')).toBe(-1);
		expect(playSnellie(state, 'player_1', BLENSEN, BLENSEN_DEF).success).toBe(false);
	});
});
