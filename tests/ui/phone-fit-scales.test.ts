// @ts-nocheck
// Phase 65-05 (MOB-01, D-05): the pure solver behind the phone whole-table fit. Given the board height available and the board
// scrollHeight measured at three scale settings, it picks the opponent scale first (down to 0.7) and my scale only after that
// (down to 0.9); when even that does not fit it returns the minimums and the board scrolls inside itself.
import { describe, it, expect } from 'vitest';
import { computePhoneScales } from '../../src/ui/phone/computePhoneScales.js';

describe('computePhoneScales (D-05: the opponent shrinks first)', () => {
	it('leaves both sides at 1 when the table already fits', () => {
		expect(computePhoneScales({ available: 600, full: 600, oppMin: 520, bothMin: 480 })).toEqual({ opp: 1, me: 1 });
		expect(computePhoneScales({ available: 700, full: 600, oppMin: 520, bothMin: 480 })).toEqual({ opp: 1, me: 1 });
	});

	it('shrinks only the opponent while the opponent alone is enough', () => {
		// full 600, oppMin 520, available 560: half of the way from full to oppMin -> 1 - 0.3 * 40 / 80 = 0.85
		expect(computePhoneScales({ available: 560, full: 600, oppMin: 520, bothMin: 480 })).toEqual({ opp: 0.85, me: 1 });
	});

	it('reaches exactly the opponent minimum when oppMin is just enough', () => {
		expect(computePhoneScales({ available: 520, full: 600, oppMin: 520, bothMin: 480 })).toEqual({ opp: 0.7, me: 1 });
	});

	it('shrinks my side only after the opponent is at its minimum', () => {
		// full 700, oppMin 600, bothMin 540, available 570: 1 - 0.1 * 30 / 60 = 0.95
		expect(computePhoneScales({ available: 570, full: 700, oppMin: 600, bothMin: 540, minOpp: 0.7, minMe: 0.9 })).toEqual({ opp: 0.7, me: 0.95 });
	});

	it('returns both minimums when nothing fits (the board then scrolls inside itself)', () => {
		expect(computePhoneScales({ available: 400, full: 700, oppMin: 600, bothMin: 540 })).toEqual({ opp: 0.7, me: 0.9 });
	});

	it('honours custom minimums', () => {
		expect(computePhoneScales({ available: 400, full: 700, oppMin: 600, bothMin: 540, minOpp: 0.6, minMe: 0.8 })).toEqual({ opp: 0.6, me: 0.8 });
	});

	it('never goes above 1 and never below the minimums, over a sweep of available heights', () => {
		for (let available = 100; available <= 900; available += 7) {
			const { opp, me } = computePhoneScales({ available, full: 700, oppMin: 600, bothMin: 540 });
			expect(opp).toBeGreaterThanOrEqual(0.7);
			expect(opp).toBeLessThanOrEqual(1);
			expect(me).toBeGreaterThanOrEqual(0.9);
			expect(me).toBeLessThanOrEqual(1);
		}
	});

	it('shrinks the opponent before me, monotonically, over the sweep', () => {
		let previous = { opp: 1, me: 1 };
		for (let available = 900; available >= 100; available -= 5) {
			const now = computePhoneScales({ available, full: 700, oppMin: 600, bothMin: 540 });
			expect(now.opp).toBeLessThanOrEqual(previous.opp);
			expect(now.me).toBeLessThanOrEqual(previous.me);
			if (now.me < 1) expect(now.opp).toBe(0.7);
			previous = now;
		}
	});

	it('rounds to 3 decimals', () => {
		const { opp } = computePhoneScales({ available: 557, full: 603, oppMin: 511, bothMin: 470 });
		expect(opp).toBe(Math.round(opp * 1000) / 1000);
	});

	it('returns { opp: 1, me: 1 } for NaN, undefined, missing or zero input', () => {
		const one = { opp: 1, me: 1 };
		expect(computePhoneScales({ available: NaN, full: 700, oppMin: 600, bothMin: 540 })).toEqual(one);
		expect(computePhoneScales({ available: 500, full: undefined, oppMin: 600, bothMin: 540 })).toEqual(one);
		expect(computePhoneScales({ available: 500, full: 700, oppMin: null, bothMin: 540 })).toEqual(one);
		expect(computePhoneScales({ available: 0, full: 700, oppMin: 600, bothMin: 540 })).toEqual(one);
		expect(computePhoneScales({ available: 500, full: 0, oppMin: 0, bothMin: 0 })).toEqual(one);
		expect(computePhoneScales({})).toEqual(one);
		expect(computePhoneScales()).toEqual(one);
	});

	it('does not touch its input object', () => {
		const input = Object.freeze({ available: 570, full: 700, oppMin: 600, bothMin: 540, minOpp: 0.7, minMe: 0.9 });
		expect(() => computePhoneScales(input)).not.toThrow();
		expect(input).toEqual({ available: 570, full: 700, oppMin: 600, bothMin: 540, minOpp: 0.7, minMe: 0.9 });
	});
});
