// @ts-nocheck
// Phase 72-11 (D-13): toPendingChoiceOptions turns state.pendingChoice into { options, leave, promptCard } for the option modal.
import { describe, expect, it } from 'vitest';
import { toPendingChoiceOptions } from '../../src/ui/actions/toPendingChoiceOptions.js';

describe('toPendingChoiceOptions', () => {
	it('an option with a cardId becomes a card row, ids are the option positions', () => {
		const out = toPendingChoiceOptions({ options: [{ label: 'A', cardId: 'piecie_a', index: 0 }, { label: 'B', cardId: 'piecie_b', index: 1 }] });
		expect(out.options).toEqual([
			{ id: '0', label: 'A', card: { cardId: 'piecie_a' } },
			{ id: '1', label: 'B', card: { cardId: 'piecie_b' } },
		]);
		expect(out.leave).toBeNull();
		expect(out.promptCard).toBeNull();
	});
	it('index -1 is the leave option, kept out of the rows, with its own label and position id', () => {
		const out = toPendingChoiceOptions({ options: [{ label: 'Leave it', index: -1 }, { label: 'A', cardId: 'x', index: 0 }] });
		expect(out.leave).toEqual({ id: '0', label: 'Leave it' });
		expect(out.options).toEqual([{ id: '1', label: 'A', card: { cardId: 'x' } }]);
	});
	it('choice "keep" and a leave flag are leave options too', () => {
		expect(toPendingChoiceOptions({ options: [{ label: 'Go', choice: 'activate' }, { label: 'Keep it in your hand', choice: 'keep' }] }).leave)
			.toEqual({ id: '1', label: 'Keep it in your hand' });
		expect(toPendingChoiceOptions({ options: [{ label: 'Put none on top', leave: true }, { label: 'x' }] }).leave)
			.toEqual({ id: '0', label: 'Put none on top' });
	});
	it('plain options (a Mosje pick, text) stay plain rows', () => {
		const out = toPendingChoiceOptions({ options: [{ label: 'Coert', slotIndex: 0 }, 'Text'] });
		expect(out.options).toEqual([{ id: '0', label: 'Coert' }, { id: '1', label: 'Text' }]);
		expect(out.leave).toBeNull();
	});
	it('promptCard is the Ming drawn card, else null', () => {
		expect(toPendingChoiceOptions({ options: [], promptCardId: 'piecie_x' }).promptCard).toBe('piecie_x');
		expect(toPendingChoiceOptions({ options: [] }).promptCard).toBeNull();
	});
});
