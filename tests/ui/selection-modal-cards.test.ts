// 72-01: the generic option modal's pure helpers (card options, leave option, prompt card).
import { describe, expect, it } from 'vitest';
// @ts-expect-error JS module without type declarations
import { resolveOptionCard } from '../../src/ui/modals/resolveOptionCard.js';
// @ts-expect-error JS module without type declarations
import { buildOptionRowHtml } from '../../src/ui/modals/buildOptionRowHtml.js';
// @ts-expect-error JS module without type declarations
import { buildLeaveOptionHtml } from '../../src/ui/modals/buildLeaveOptionHtml.js';
// @ts-expect-error JS module without type declarations
import { mountOptionCards } from '../../src/ui/modals/mountOptionCards.js';

describe('resolveOptionCard', () => {
	it('resolves a cardId to the definition', () => {
		const card = resolveOptionCard({ cardId: 'mosje_alyssa_bulldozer' });
		expect(card.name).toBeTruthy();
		expect(card.type).toBe('MOSJE');
	});
	it('merges live fields over the definition', () => {
		const card = resolveOptionCard({ cardId: 'mosje_alyssa_bulldozer', live: { level: 2, mp: 45 } });
		expect(card.level).toBe(2);
		expect(card.mp).toBe(45);
		expect(card.name).toBeTruthy();
	});
	it('returns a given card object', () => {
		const obj = { id: 'x', name: 'X', type: 'MOSJE' };
		expect(resolveOptionCard({ card: obj })).toBe(obj);
	});
	it('returns null without card fields or for an unknown id', () => {
		expect(resolveOptionCard({ id: 'a', label: 'A' })).toBeNull();
		expect(resolveOptionCard({ cardId: 'no_such_card' })).toBeNull();
		expect(resolveOptionCard(null)).toBeNull();
	});
});

describe('buildOptionRowHtml', () => {
	it('plain row is byte-identical to the old template', () => {
		const html = buildOptionRowHtml({ id: 'a', label: 'Alpha', metaLabel: '10 MP' }, 0);
		const expected = `<button class="modal-mosje-select-btn " data-id="a" type="button" >
					<span class="mosje-select-name">Alpha</span>
					<span class="mosje-select-mp">10 MP</span>
				</button>`;
		expect(html).toBe(expected);
	});
	it('plain disabled row keeps the old markup', () => {
		const html = buildOptionRowHtml({ id: 'a', label: 'Alpha', disabled: true }, 0);
		expect(html).toBe(`<button class="modal-mosje-select-btn modal-mosje-select-btn--disabled" data-id="a" type="button" disabled>
					<span class="mosje-select-name">Alpha</span>
					
				</button>`);
	});
	it('card row has slot, data-id, escaped label and raw meta', () => {
		const html = buildOptionRowHtml({ id: 'm1', label: 'A <b>', cardId: 'mosje_alyssa_bulldozer', metaLabel: '<i>45</i>' }, 3);
		expect(html).toContain('modal-mosje-select-btn modal-option--card');
		expect(html).toContain('data-id="m1"');
		expect(html).toContain('data-option-card="3"');
		expect(html).toContain('option-card-slot');
		expect(html).toContain('A &lt;b&gt;');
		expect(html).not.toContain('A <b>');
		expect(html).toContain('<span class="mosje-select-mp"><i>45</i></span>');
		expect(html).not.toContain(' disabled');
	});
	it('disabled card row is disabled and flagged', () => {
		const html = buildOptionRowHtml({ id: 'm1', label: 'M', cardId: 'mosje_alyssa_bulldozer', disabled: true }, 0);
		expect(html).toContain('modal-mosje-select-btn--disabled');
		expect(html).toMatch(/type="button" disabled/);
	});
});

describe('buildLeaveOptionHtml', () => {
	it('builds the ghost leave button', () => {
		const html = buildLeaveOptionHtml({ id: 'leave', label: 'Leave <it>' });
		expect(html).toContain('modal-btn modal-btn--ghost modal-option-leave');
		expect(html).toContain('data-id="leave"');
		expect(html).toContain('Leave &lt;it&gt;');
	});
	it('is empty with no argument', () => {
		expect(buildLeaveOptionHtml()).toBe('');
	});
});

describe('mountOptionCards', () => {
	function fakeSlot(index: string) {
		const children: unknown[] = [];
		return { dataset: { optionCard: index }, children, appendChild(c: unknown) { children.push(c); } };
	}
	it('appends a rendered face into each resolvable slot', () => {
		const slots = [fakeSlot('0'), fakeSlot('1')];
		const container = { querySelectorAll: () => slots };
		const options = [{ id: 'a', cardId: 'mosje_alyssa_bulldozer' }, { id: 'b', label: 'plain' }];
		const rendered: unknown[] = [];
		mountOptionCards(container, options, (card: unknown, opts: unknown) => { rendered.push([card, opts]); return { face: true }; });
		expect(slots[0].children).toHaveLength(1);
		expect(slots[1].children).toHaveLength(0);
		expect((rendered[0] as any)[1]).toEqual({ compact: true });
	});
});
