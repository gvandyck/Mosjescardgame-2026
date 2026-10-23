import { describe, it, expect } from 'vitest';
import { getTextBoxLayout } from '../../src/ui/cardV1/getTextBoxLayout.js';
import { TEXT_SIZES } from '../../src/ui/cardV1/faceTokens.js';

// Pure estimate of the 2.0 frosted text box (62-UI-SPEC): ability text starts at 14.5, steps to 13, floors at 11.5,
// then clamps (fade + "...") instead of shrinking further. The level rows (Mosje) take room from the text.
const text = (n: number) => ['x'.repeat(n)];

describe('getTextBoxLayout', () => {
  it('short text keeps the default size and is not clamped', () => {
    expect(getTextBoxLayout({ lines: text(60) })).toEqual({ size: 14.5, clamped: false });
    expect(getTextBoxLayout({ lines: text(100), levelRowCount: 3 })).toEqual({ size: 14.5, clamped: false });
    expect(getTextBoxLayout({ lines: [] })).toEqual({ size: 14.5, clamped: false });
  });

  it('longer text steps down 14.5 -> 13 -> 11.5 before it clamps', () => {
    const at = (n: number) => getTextBoxLayout({ lines: text(n), levelRowCount: 3 });
    expect(at(450)).toEqual({ size: 13, clamped: false });
    expect(at(600)).toEqual({ size: 11.5, clamped: false });
  });

  it('text that cannot fit at the floor is clamped at the floor size', () => {
    expect(getTextBoxLayout({ lines: text(1000), levelRowCount: 3 })).toEqual({ size: 11.5, clamped: true });
    expect(getTextBoxLayout({ lines: text(5000) })).toEqual({ size: 11.5, clamped: true });
  });

  it('only ever uses the three sizes of the face tokens', () => {
    for (let n = 0; n <= 1500; n += 25) {
      for (const levelRowCount of [0, 3]) {
        expect(TEXT_SIZES, `${n}/${levelRowCount}`).toContain(getTextBoxLayout({ lines: text(n), levelRowCount }).size);
      }
    }
  });

  it('3 level rows leave less room than 0', () => {
    expect(getTextBoxLayout({ lines: text(450), levelRowCount: 0 }).size).toBe(14.5);
    expect(getTextBoxLayout({ lines: text(450), levelRowCount: 3 }).size).toBe(13);
  });

  it('a wrapping info line leaves less room for the text', () => {
    const short = getTextBoxLayout({ lines: text(450), levelRowCount: 3, info: 'Needs: a short thing' });
    const long = getTextBoxLayout({ lines: text(450), levelRowCount: 3, info: 'Needs: '.concat('a long requirement that wraps onto more than one line '.repeat(3)) });
    expect(short.size).toBe(13);
    expect(long.size).toBeLessThan(short.size);
  });

  it('more paragraphs need more room than the same characters in one line', () => {
    const one = getTextBoxLayout({ lines: text(440), levelRowCount: 3 });
    const many = getTextBoxLayout({ lines: Array.from({ length: 8 }, () => 'x'.repeat(55)), levelRowCount: 3 });
    expect(many.size).toBeLessThanOrEqual(one.size);
  });

  it('the boxed layout is never roomier than the full-art layout', () => {
    for (let n = 10; n <= 1500; n += 10) {
      for (const levelRowCount of [0, 3]) {
        const full = getTextBoxLayout({ lines: text(n), levelRowCount, layout: 'fullart' });
        const boxed = getTextBoxLayout({ lines: text(n), levelRowCount, layout: 'boxed' });
        expect(boxed.size, `${n}/${levelRowCount} size`).toBeLessThanOrEqual(full.size);
        expect(Number(boxed.clamped), `${n}/${levelRowCount} clamped`).toBeGreaterThanOrEqual(Number(full.clamped));
      }
    }
  });
});
