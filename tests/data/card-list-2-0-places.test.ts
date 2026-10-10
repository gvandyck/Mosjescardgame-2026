// Phase 53-05 (E29, Place part): Card List 2.0 vs places.js.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { PLACES } from '../../src/data/places.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const get = (id: string) => (PLACES as any[]).find((p) => p.id === id);
const stars = (r: string) => (r.match(/★/g) || []).length;

describe('Places carry Card List 2.0 data', () => {
  it('parses 20 place rows', () => expect(list.places).toHaveLength(20));

  for (const row of list.places as any[]) {
    const id = CARD_ID_MAP.places[row.name];
    it(`${row.name} (${id})`, () => {
      const p = get(id);
      expect(p, 'card exists').toBeTruthy();
      expect(p.name).toBe(row.name);
      expect(p.cost).toBe(row.cost);
      expect(p.rarity).toBe(row.rarity);
      expect(p.description).toBe(row.text);
      expect(p.goodFor).toEqual(row.goodFor);
      expect(p.badFor).toEqual(row.badFor);
      expect(p.limitPerDeck).toBe(stars(row.rarity) === 5 ? 1 : 2);
    });
  }

  it('5-star Places are limited to 1 per deck', () => {
    expect(get('place_delluft').limitPerDeck).toBe(1);
    expect(get('place_synergy_chamber').limitPerDeck).toBe(1);
  });

  it('Eendjes Voeren rename holds', () => {
    expect(get('place_eendjes_voeren').name).toBe('Eendjes Voeren');
  });
});
