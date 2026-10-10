// Phase 53-04 (E28): Card List 2.0 Piecie tag counts.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore JS module
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

const listed = (arr: any[], map: Record<string, string>) => {
  const ids = new Set(Object.values(map));
  return arr.filter((c) => ids.has(c.id));
};
const piecies = listed(PIECIES, CARD_ID_MAP.piecies);
const snelle = listed(SNELLE_PIECIES, CARD_ID_MAP.snelle);
const count = (tag: string) => piecies.filter((c) => c.tag === tag).length;

describe('2.0 tags', () => {
  it('covers all 73 Piecies and 20 Snelle', () => {
    expect(piecies).toHaveLength(73);
    expect(snelle).toHaveLength(20);
  });
  it('has exactly food 7, pet 5, substance 9, gear 6', () => {
    expect(count('food')).toBe(7);
    expect(count('pet')).toBe(5);
    expect(count('substance')).toBe(9);
    expect(count('gear')).toBe(6);
  });
  it('tag is a single string or null, from the 4 allowed', () => {
    for (const c of [...piecies, ...snelle]) {
      expect(Array.isArray(c.tag), c.id).toBe(false);
      expect(['food', 'pet', 'substance', 'gear', null], c.id).toContain(c.tag);
    }
  });
  it('Snelle have no tag', () => {
    for (const c of snelle) expect(c.tag, c.id).toBeNull();
  });
  it('the food set is the 7 Card List food Piecies', () => {
    const names = ['Kannetje Melk', 'Warm Kannetje Melk', 'Broodje Döner', 'Ronald Kip',
      "Chef's Special", 'Varkenspootjes', 'Protein Shake'];
    const ids = names.map((n) => CARD_ID_MAP.piecies[n]).sort();
    expect(piecies.filter((c) => c.tag === 'food').map((c) => c.id).sort()).toEqual(ids);
  });
});
