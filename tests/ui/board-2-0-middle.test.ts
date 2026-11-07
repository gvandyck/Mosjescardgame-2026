// Phase 63-03: the pure builders of the middle strip: Quest stacks, Place felt tint, Place owner chip
// (63-UI-SPEC "Quest stacks" + "Place tile and felt tint", D-08, D-09, D-10).
import { describe, it, expect } from 'vitest';
import { buildQuestStacksHtml } from '../../src/ui/board/buildQuestStacksHtml.js';
import { getPlaceTint } from '../../src/ui/board/getPlaceTint.js';
import { formatPlaceOwnerChip } from '../../src/ui/board/formatPlaceOwnerChip.js';
import { PLACES } from '../../src/data/places.js';

const deckOf = (n: number) => Array.from({ length: n }, () => 'quest_improvise');
const stacks = (over: Record<string, any> = {}) => ({
	PHYSICAL: { faceUp: 'quest_tough_it_out', deck: deckOf(11), discard: [], tokens: 0 },
	DIGITAL: { faceUp: 'quest_debug_system', deck: deckOf(9), discard: [], tokens: 0 },
	CREATIVE: { faceUp: null, deck: [], discard: [], tokens: 0 },
	...over,
});
// One stack element's HTML: split the strip at every stack root (class "quest-stack" or "quest-stack quest-stack--empty").
const stackHtml = (html: string, id: string) =>
	html.split(/(?=<div class="quest-stack[ "])/).find((part) => part.includes(`data-quest-stack="${id}"`)) ?? '';

describe('buildQuestStacksHtml (D-09, UI-01)', () => {
	const html = buildQuestStacksHtml(stacks());

	it('draws one stack per Quest stack, in Physical / Digital / Creative order, with all hooks', () => {
		const ids = [...html.matchAll(/data-quest-stack="([A-Z]+)"/g)].map((m) => m[1]);
		expect(ids).toEqual(['PHYSICAL', 'DIGITAL', 'CREATIVE']);
		const physical = stackHtml(html, 'PHYSICAL');
		expect(physical).toContain('data-stack="PHYSICAL"');
		expect(physical).toContain('data-quest="quest_tough_it_out"');
		expect(physical).toContain('data-stack-count="11"');
	});

	it('puts the 2.0 Quest tile on 2 edge layers with a count tab', () => {
		const physical = stackHtml(html, 'PHYSICAL');
		expect(physical.match(/quest-stack__edge /g)).toHaveLength(2);
		expect(physical).toContain('class="card card--quest');
		expect(physical).toContain('data-card-id="quest_tough_it_out"');
		expect(physical).toContain('cv2-tile');
		expect(physical).toContain('Tough It Out');
		expect(physical).toContain('data-cv1-need=');
		expect(physical).toContain('>11 left<');
	});

	it('fills the fail pips from the stack tokens', () => {
		const filled = (h: string) => (h.match(/data-cv1-pip="filled"/g) || []).length;
		expect(filled(stackHtml(html, 'PHYSICAL'))).toBe(0);
		const one = buildQuestStacksHtml(stacks({ PHYSICAL: { faceUp: 'quest_tough_it_out', deck: deckOf(3), discard: [], tokens: 1 } }));
		expect(filled(stackHtml(one, 'PHYSICAL'))).toBe(1);
		expect(stackHtml(one, 'PHYSICAL').match(/data-cv1-pip="/g)).toHaveLength(2);
		const two = buildQuestStacksHtml(stacks({ PHYSICAL: { faceUp: 'quest_tough_it_out', deck: deckOf(3), discard: [], tokens: 2 } }));
		expect(filled(stackHtml(two, 'PHYSICAL'))).toBe(2);
	});

	it('an empty stack is a dashed outline reading "Empty" with no Quest tile', () => {
		const creative = stackHtml(html, 'CREATIVE');
		expect(creative).toContain('quest-stack--empty');
		expect(creative).toContain('>Empty<');
		expect(creative).toContain('data-stack-count="0"');
		expect(creative).not.toContain('cv2-tile');
		expect(creative).not.toContain('data-quest="');
	});

	it('counts the cards left in the deck, singular or not', () => {
		const one = buildQuestStacksHtml(stacks({ PHYSICAL: { faceUp: 'quest_tough_it_out', deck: deckOf(1), discard: [], tokens: 0 } }));
		expect(stackHtml(one, 'PHYSICAL')).toContain('data-stack-count="1"');
		expect(stackHtml(one, 'PHYSICAL')).toContain('>1 left<');
	});

	it('survives missing state (no stacks at all = three empty stacks)', () => {
		const none = buildQuestStacksHtml(null);
		expect(none.match(/quest-stack--empty/g)).toHaveLength(3);
	});

	it('escapes every attribute value (T-63-05)', () => {
		expect(html).not.toMatch(/data-[a-z-]+="[^"]*[<>][^"]*"/);
		const evil = buildQuestStacksHtml({ PHYSICAL: { faceUp: '"><img src=x onerror=alert(1)>', deck: [], tokens: 0 } });
		expect(evil).not.toContain('<img src=x');
	});
});

describe('getPlaceTint (D-10)', () => {
	it('a Place good for exactly one Quest stack takes that stack colour', () => {
		expect(getPlaceTint({ goodFor: ['Physical', 'Gandoe'] })).toBe('#C2410C');
		expect(getPlaceTint({ goodFor: ['Digital'] })).toBe('#0E7490');
		expect(getPlaceTint({ goodFor: ['Creative'] })).toBe('#A21CAF');
	});

	it('none, several or no Place give the warm neutral tone', () => {
		expect(getPlaceTint({ goodFor: [] })).toBe('#B45309');
		expect(getPlaceTint({ goodFor: ['Physical', 'Digital'] })).toBe('#B45309');
		expect(getPlaceTint({ goodFor: ['Coert', 'Questers'] })).toBe('#B45309');
		expect(getPlaceTint({})).toBe('#B45309');
		expect(getPlaceTint(null)).toBe('#B45309');
	});

	it('every real Place gets a hex colour', () => {
		for (const place of PLACES) expect(getPlaceTint(place)).toMatch(/^#[0-9A-F]{6}$/);
	});
});

describe('formatPlaceOwnerChip (D-08)', () => {
	it('reads YOU / BOT with the turns the Place has been active', () => {
		expect(formatPlaceOwnerChip({ isMine: true, turns: 2 })).toBe('YOU · 2 turns');
		expect(formatPlaceOwnerChip({ isMine: false, turns: 1 })).toBe('BOT · 1 turn');
		expect(formatPlaceOwnerChip({ isMine: true, turns: 0 })).toBe('YOU · 0 turns');
	});

	it('treats a missing or bad turn count as 0', () => {
		expect(formatPlaceOwnerChip({ isMine: false })).toBe('BOT · 0 turns');
		expect(formatPlaceOwnerChip({ isMine: true, turns: -3 })).toBe('YOU · 0 turns');
	});
});
