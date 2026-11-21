// @ts-nocheck
// Phase 72.1-03 (D-07): the one "Show cards" toggle of the lobby deck tiles. Node has no DOM, so the test hands the builder a
// tiny fake document: the builder may only use createElement, type, className, textContent, setAttribute, addEventListener
// on the button, and setAttribute / removeAttribute / getAttribute on the tiles element (never innerHTML).
import { describe, it, expect } from 'vitest';
import { buildShowCardsToggle } from '../../src/ui/lobby/buildShowCardsToggle.js';

function fakeElement(tag) {
	const attrs = new Map();
	const handlers = {};
	let text = '';
	const el = {
		tagName: tag.toUpperCase(),
		type: '',
		className: '',
		get textContent() { return text; },
		set textContent(v) { text = String(v); },
		get innerHTML() { throw new Error('the toggle must not read innerHTML'); },
		set innerHTML(_v) { throw new Error('the toggle must not write innerHTML'); },
		setAttribute(name, value) { attrs.set(name, String(value)); },
		removeAttribute(name) { attrs.delete(name); },
		getAttribute(name) { return attrs.has(name) ? attrs.get(name) : null; },
		addEventListener(name, fn) { handlers[name] = fn; },
		click() { handlers.click?.(); },
	};
	return el;
}
const doc = { createElement: fakeElement };

describe('buildShowCardsToggle', () => {
	it('is a closed type=button .deck-tiles__toggle that says Show cards', () => {
		const tiles = fakeElement('div');
		const button = buildShowCardsToggle(tiles, doc);
		expect(button.tagName).toBe('BUTTON');
		expect(button.type).toBe('button');
		expect(button.className).toBe('deck-tiles__toggle');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(button.textContent).toBe('Show cards');
		expect(tiles.getAttribute('data-cards-open')).toBeNull();
	});

	it('a click opens: data-cards-open on the tiles, aria-expanded true, Hide cards', () => {
		const tiles = fakeElement('div');
		const button = buildShowCardsToggle(tiles, doc);
		button.click();
		expect(tiles.getAttribute('data-cards-open')).toBe('true');
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(button.textContent).toBe('Hide cards');
	});

	it('a second click undoes all three', () => {
		const tiles = fakeElement('div');
		const button = buildShowCardsToggle(tiles, doc);
		button.click();
		button.click();
		expect(tiles.getAttribute('data-cards-open')).toBeNull();
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(button.textContent).toBe('Show cards');
	});
});
