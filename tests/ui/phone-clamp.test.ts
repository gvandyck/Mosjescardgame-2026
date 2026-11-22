// @ts-nocheck
// Phase 72.1-09 (D-04): the pure clamp behind the phone activation banner. A chip centred on a tile near a screen edge must stay
// fully inside the viewport with a margin.
import { describe, it, expect } from 'vitest';
import { clampToViewport } from '../../src/ui/phone/clampToViewport.js';

describe('clampToViewport', () => {
	it('keeps a left-edge chip inside: centred at 60, width 150, viewport 395 gives left 8', () => {
		expect(clampToViewport({ centreX: 60, width: 150, viewport: 395 })).toBe(8);
	});
	it('keeps a right-edge chip inside: centred at 380 gives 395 - 150 - 8', () => {
		expect(clampToViewport({ centreX: 380, width: 150, viewport: 395 })).toBe(395 - 150 - 8);
	});
	it('leaves a chip well inside centred', () => {
		expect(clampToViewport({ centreX: 200, width: 100, viewport: 395 })).toBe(150);
	});
	it('a chip wider than the viewport minus margins gets left 8', () => {
		expect(clampToViewport({ centreX: 200, width: 400, viewport: 395 })).toBe(8);
	});
	it('honours a custom margin', () => {
		expect(clampToViewport({ centreX: 10, width: 100, viewport: 395, margin: 16 })).toBe(16);
	});
});
