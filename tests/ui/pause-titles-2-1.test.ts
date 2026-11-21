import { describe, it, expect } from 'vitest';
// @ts-ignore plain js module
import { pauseTitle } from '../../src/ui/actions/pauseTitle.js';

// 72-17: every pause of the 2.1 cards says what it is about; the title never stays the bare word "Choose".
describe('pauseTitle: a specific title for each new pause', () => {
	const cases: Array<[string, any, string]> = [
		['Wizard top 3', { key: 'wizard_pick', choiceKind: 'handCard' }, 'Take 1 of the top 3 cards'],
		['FPS West bottom pick', { key: 'fps_west_bottom', choiceKind: 'handCard' }, "Put 1 card of their hand on the bottom of their deck"],
		['Ming activate or keep', { key: 'ming_activate', choiceKind: 'mingActivate', prompt: 'Ming drew Kannetje Melk' }, 'Activate the card Ming drew?'],
		['Binti discard', { key: 'binti_discard_card', choiceKind: 'handCard' }, 'Discard 1 card'],
		['Stookerino discard', { key: 'stook_discard', choiceKind: 'handCard', prompt: 'Discard 1 card from your hand' }, 'Discard 1 card'],
		['Schetsboek', { key: 'schets_pick', choiceKind: 'handCard', prompt: 'Take 1 card, the other goes to the bottom' }, 'Take 1 card, the other goes to the bottom'],
		['attach target', { key: 'attach_mosje', choiceKind: 'ownMosje', prompt: 'Attach to which Mosje?' }, 'Attach to which Mosje?'],
		['attach replace', { key: 'attach_replace', choiceKind: 'attachedCard', prompt: 'Replace which attached card?' }, 'Replace which attached card?'],
	];
	for (const [label, pc, title] of cases) {
		it(label, () => { expect(pauseTitle(pc)).toBe(title); });
	}

	it('an unknown key uses its prompt, then the kind of choice, never the bare word Choose', () => {
		expect(pauseTitle({ key: 'x', choiceKind: 'handCard', prompt: 'Search your deck for a FOOD Piecie' })).toBe('Search your deck for a FOOD Piecie');
		for (const kind of ['handCard', 'ownMosje', 'oppMosje', 'ownPiecieSlot', 'discardCard', 'place', 'die', 'mosje', 'welloeMosje', 'cardName', 'mpValue']) {
			const t = pauseTitle({ key: 'unknown', choiceKind: kind });
			expect(t, kind).not.toBe('Choose');
			expect(t.length, kind).toBeGreaterThan(8);
		}
		expect(pauseTitle({})).not.toBe('Choose');
	});
});
