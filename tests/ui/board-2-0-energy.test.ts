// Phase 63-02: the pure builders of the Energy crystals, the hand play cost and the Welloe pile
// (63-UI-SPEC "Energy crystals", D-12, D-13).
import { describe, it, expect } from 'vitest';
import { buildEnergyCrystals } from '../../src/ui/board/buildEnergyCrystals.js';
import { getHandPlayCost } from '../../src/ui/board/getHandPlayCost.js';
import { buildWelloePile } from '../../src/ui/board/buildWelloePile.js';
import { PLACES } from '../../src/data/places.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

const gems = (html: string) => [...html.matchAll(/<i class="energy-gem"[^>]*>/g)].map((m) => m[0]);

describe('buildEnergyCrystals (D-12, UI-02)', () => {
	const html = buildEnergyCrystals({ energy: 4, prevEnergy: 2 });

	it('draws exactly 6 gems, 4 full and 2 empty', () => {
		const list = gems(html);
		expect(list).toHaveLength(6);
		expect(list.filter((g) => g.includes('data-crystal="full"'))).toHaveLength(4);
		expect(list.filter((g) => g.includes('data-crystal="empty"'))).toHaveLength(2);
	});

	it('fills from the first gem and exposes the energy on the root', () => {
		const list = gems(html);
		expect(list[0]).toContain('data-crystal="full"');
		expect(list[3]).toContain('data-crystal="full"');
		expect(list[4]).toContain('data-crystal="empty"');
		expect(html).toContain('data-energy="4"');
		expect(html).toContain('data-energy-max="6"');
	});

	it('shows the count "4/6" and an aria-label', () => {
		expect(html).toContain('<span class="energy-count">4/6</span>');
		expect(html).toContain('aria-label="Energy 4 of 6"');
	});

	it('marks the gems gained since prevEnergy with a staggered gain animation', () => {
		const list = gems(html);
		expect(list[2]).toContain('data-crystal-anim="gain"');
		expect(list[2]).toContain('--i:0');
		expect(list[3]).toContain('data-crystal-anim="gain"');
		expect(list[3]).toContain('--i:1');
		expect(list.filter((g) => g.includes('data-crystal-anim'))).toHaveLength(2);
	});

	it('marks the gems spent since prevEnergy with a spend animation (they are empty now)', () => {
		const list = gems(buildEnergyCrystals({ energy: 3, prevEnergy: 5 }));
		const spent = list.filter((g) => g.includes('data-crystal-anim="spend"'));
		expect(spent).toHaveLength(2);
		for (const gem of spent) expect(gem).toContain('data-crystal="empty"');
		expect(list[3]).toContain('data-crystal-anim="spend"');
		expect(list[4]).toContain('data-crystal-anim="spend"');
	});

	it('animates nothing without a prevEnergy or when the energy did not change', () => {
		expect(buildEnergyCrystals({ energy: 4 })).not.toContain('data-crystal-anim');
		expect(buildEnergyCrystals({ energy: 4, prevEnergy: 4 })).not.toContain('data-crystal-anim');
		expect(buildEnergyCrystals({ energy: 4, prevEnergy: undefined })).not.toContain('data-crystal-anim');
	});

	it('never draws a 7th gem: 9 clamps to 6', () => {
		const capped = buildEnergyCrystals({ energy: 9 });
		expect(gems(capped)).toHaveLength(6);
		expect(capped).toContain('data-energy="6"');
		expect(capped).toContain('>6/6<');
		expect(gems(capped).every((g) => g.includes('data-crystal="full"'))).toBe(true);
	});

	it('clamps negative or garbage energy to 0', () => {
		for (const energy of [-3, NaN, undefined, null, 'x']) {
			const empty = buildEnergyCrystals({ energy: energy as number });
			expect(empty).toContain('data-energy="0"');
			expect(gems(empty).every((g) => g.includes('data-crystal="empty"'))).toBe(true);
		}
	});

	it('works with no argument at all', () => {
		expect(gems(buildEnergyCrystals())).toHaveLength(6);
	});
});

describe('getHandPlayCost (as the engine pays it)', () => {
	const state = { turnNumber: 3, jensenPlayedTurn: 0, activePlace: null, activePlayerId: 'player_1', players: { player_1: {}, player_2: {} } };
	const place = PLACES.find((p) => Number(p.cost) > 0)!;
	const mosje = MOSJES.find((m) => Number(m.cost) > 0)!;
	const snelle = SNELLE_PIECIES.find((s) => Number(s.cost) > 0 && s.id !== 'snelle_blensen')!;

	it('a Piecie from hand is placed face-down for free', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: 'piecie_anything', type: 'PIECIE' })).toBe(0);
	});
	it('a Mosje costs its Energy cost', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: mosje.id, type: 'MOSJE' })).toBe(mosje.cost);
	});
	it('a Place costs its Energy cost', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: place.id, type: 'PLACE' })).toBe(place.cost);
	});
	it('a Snelle costs what getSnelleCost says', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: snelle.id, type: 'SNELLE_PIECIE' })).toBe(snelle.cost);
	});
	it('Blensen! is 4, or free after a Jensen! this turn', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: 'snelle_blensen', type: 'SNELLE_PIECIE' })).toBe(4);
		expect(getHandPlayCost({ ...state, jensenPlayedTurn: 3 }, 'player_1', { cardId: 'snelle_blensen', type: 'SNELLE_PIECIE' })).toBe(0);
	});
	it('the Delluft parking fee is added to a paid card', () => {
		const delluft = { ...state, activePlace: 'place_delluft', players: { player_1: { activeSlots: [null, null] }, player_2: {} } };
		expect(getHandPlayCost(delluft, 'player_1', { cardId: mosje.id, type: 'MOSJE' })).toBe(mosje.cost + 1);
		expect(getHandPlayCost(delluft, 'player_1', { cardId: 'piecie_anything', type: 'PIECIE' })).toBe(0);
	});
	it('unknown cards, Quests and missing input cost 0', () => {
		expect(getHandPlayCost(state, 'player_1', { cardId: 'nope', type: 'MOSJE' })).toBe(0);
		expect(getHandPlayCost(state, 'player_1', { cardId: 'x', type: 'QUEST' })).toBe(0);
		expect(getHandPlayCost(state, 'player_1', undefined)).toBe(0);
		expect(getHandPlayCost(null, 'player_1', { cardId: mosje.id, type: 'MOSJE' })).toBe(mosje.cost);
	});
});

describe('buildWelloePile (D-13)', () => {
	it('is empty while the pile has no cards', () => {
		expect(buildWelloePile({ count: 0 })).toBe('');
		expect(buildWelloePile({ count: -1 })).toBe('');
		expect(buildWelloePile()).toBe('');
	});
	it('is a button with data-pile, data-count, the word WELLOE and the count', () => {
		const html = buildWelloePile({ count: 2 });
		expect(html).toContain('<button');
		expect(html).toContain('data-pile="welloe"');
		expect(html).toContain('data-count="2"');
		expect(html).toContain('data-slot-kind="pile"');
		expect(html).toContain('WELLOE');
		expect(html).toContain('>2<');
	});
});
