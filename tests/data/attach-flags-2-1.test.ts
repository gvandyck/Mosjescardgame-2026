// Phase 70-04 (D-17): every starter card whose text has the keyword Attach carries attach: true, no other card does.
import { describe, expect, it } from 'vitest';
// @ts-ignore JS modules
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

const live = (c: any) => c.disabled !== true && c.isBoosterOnly !== true;
const hasKeyword = (c: any) => /\*\*Attach:\*\*/.test(c.description || '');

describe('attach flag (D-17)', () => {
  const cards = [...PIECIES, ...SNELLE_PIECIES].filter(live);

  it('every live card with the Attach keyword is flagged', () => {
    const missing = cards.filter(hasKeyword).filter((c: any) => c.attach !== true).map((c: any) => c.id);
    expect(missing).toEqual([]);
  });

  it('no card without the keyword is flagged', () => {
    const extra = [...PIECIES, ...SNELLE_PIECIES].filter((c: any) => c.attach === true && !hasKeyword(c)).map((c: any) => c.id);
    expect(extra).toEqual([]);
  });

  it('the four starter Attach cards are the flagged ones', () => {
    const ids = cards.filter((c: any) => c.attach === true).map((c: any) => c.id).sort();
    expect(ids).toEqual(['piecie_dumbbells', 'piecie_hawaiishirt', 'piecie_koksmes', 'piecie_rugbybal']);
  });
});
