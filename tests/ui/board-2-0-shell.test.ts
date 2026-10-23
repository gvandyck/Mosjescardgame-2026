// Phase 63-01: the pure builders of the 2.0 board shell (63-UI-SPEC "Board geometry", D-13, T-63-01).
import { describe, it, expect } from 'vitest';
import { getFieldSlots } from '../../src/ui/board/getFieldSlots.js';
import { buildBoardSkeleton } from '../../src/ui/board/buildBoardSkeleton.js';
import { buildSlotOutlines } from '../../src/ui/board/buildSlotOutlines.js';

describe('getFieldSlots (D-13)', () => {
	it('is 7 when no Welloe pile has a card', () => {
		expect(getFieldSlots([{ welloePile: [] }, { welloePile: [] }])).toBe(7);
	});
	it('is 8 as soon as either pile has a card', () => {
		expect(getFieldSlots([{ welloePile: [{ cardId: 'mosje_binti' }] }, { welloePile: [] }])).toBe(8);
		expect(getFieldSlots([{ welloePile: [] }, { welloePile: [{ cardId: 'a' }, { cardId: 'b' }] }])).toBe(8);
	});
	it('counts a missing pile as empty', () => {
		expect(getFieldSlots([{}, { welloePile: undefined }])).toBe(7);
		expect(getFieldSlots([])).toBe(7);
		expect(getFieldSlots(undefined)).toBe(7);
	});
	it('also takes the engine players object', () => {
		expect(getFieldSlots({ player_1: { welloePile: [] }, player_2: { welloePile: [{ cardId: 'x' }] } })).toBe(8);
	});
});

describe('buildBoardSkeleton', () => {
	const html = buildBoardSkeleton({ topName: '<b>', bottomName: 'Me' });

	it('escapes both player names (T-63-01)', () => {
		expect(html).toContain('&lt;b&gt;');
		expect(html).not.toContain('<b>');
		expect(html).toContain('Me');
	});

	it('has the three board zones', () => {
		for (const zone of ['opponent', 'middle', 'player']) expect(html).toContain(`data-zone="${zone}"`);
	});

	it('keeps every old container id and adds the 2.0 ones, per side', () => {
		for (const side of ['opponent', 'player']) {
			for (const prefix of ['energy', 'zone', 'piecies', 'deck', 'discard', 'welloe', 'modifier-bar']) {
				expect(html, `${prefix}-${side}`).toContain(`id="${prefix}-${side}"`);
			}
		}
		for (const id of ['board-place', 'quest-stacks', 'board-end-turn']) expect(html).toContain(`id="${id}"`);
	});

	it('orders the middle strip Place, Quests, End Turn', () => {
		const middle = html.slice(html.indexOf('data-zone="middle"'), html.indexOf('data-zone="player"'));
		const at = (id: string) => middle.indexOf(`id="${id}"`);
		expect(at('board-place')).toBeGreaterThan(-1);
		expect(at('board-place')).toBeLessThan(at('quest-stacks'));
		expect(at('quest-stacks')).toBeLessThan(at('board-end-turn'));
	});

	it('lays both rows out in the same order (not mirrored)', () => {
		const order = (side: string) => ['energy', 'zone', 'piecies', 'deck', 'discard', 'welloe'].map((p) => html.indexOf(`id="${p}-${side}"`));
		for (const side of ['opponent', 'player']) {
			const positions = order(side);
			expect([...positions].sort((a, b) => a - b)).toEqual(positions);
		}
	});

	it('puts the opponent zone above the middle strip above the player zone', () => {
		const at = (zone: string) => html.indexOf(`data-zone="${zone}"`);
		expect(at('opponent')).toBeLessThan(at('middle'));
		expect(at('middle')).toBeLessThan(at('player'));
	});
});

describe('buildSlotOutlines', () => {
	it('returns one empty outline per missing index', () => {
		const html = buildSlotOutlines('piecie', [1]);
		expect(html.match(/<div /g)?.length).toBe(1);
		expect(html).toContain('class="board-slot board-slot--empty"');
		expect(html).toContain('data-slot-kind="piecie"');
		expect(html).toContain('data-slot-index="1"');
	});
	it('returns nothing when no slot is missing', () => {
		expect(buildSlotOutlines('mosje', [])).toBe('');
	});
	it('returns several outlines in order', () => {
		const html = buildSlotOutlines('mosje', [0, 1]);
		expect(html.indexOf('data-slot-index="0"')).toBeLessThan(html.indexOf('data-slot-index="1"'));
		expect(html.match(/data-slot-kind="mosje"/g)?.length).toBe(2);
	});
});
