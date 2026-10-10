// Phase 53-02 (E29, Mosje part): the 2.0 Card List vs src/data/mosjes.js.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { MOSJE_SYNERGY_LABELS } from '../../scripts/obby2/mosjeSynergyLabels.mjs';
// @ts-ignore JS module
import { FOIL_MOSJE_IDS } from '../../scripts/obby2/foilMosjeIds.mjs';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const byId = (id: string) => (MOSJES as any[]).find((m) => m.id === id);

describe('Card List 2.0 Mosjes in mosjes.js', () => {
  it('every Card List Mosje matches its data entry', () => {
    expect(list.mosjes).toHaveLength(32);
    for (const row of list.mosjes) {
      const id = CARD_ID_MAP.mosjes[row.name];
      const card = byId(id);
      expect(card, row.name).toBeTruthy();
      expect(card.name).toBe(row.name);
      expect(card.cost).toBe(row.cost);
      expect(card.rarity).toBe(row.rarity);
      expect(card.startMP).toBe(row.startMP);
      expect(card.abilityName).toBe(row.abilities[0].name);
      expect(card.limitPerDeck).toBe((row.rarity.match(/★/g) || []).length === 5 ? 1 : 2);
      expect(card.levels).toEqual(row.levels);
      expect(card.abilityDescription).toBe(row.abilities.map((a: any) => `${a.name}: ${a.text}`).join(' '));
      expect(card.synergyEffect).toBe(row.holderText ?? null);
      expect(card.synergyLabel).toEqual(MOSJE_SYNERGY_LABELS[id] ?? []);
      expect(card.levels[0].traits).toEqual(card.traits);
    }
  });

  it('only The Hacker has a bracketed name among Card List Mosjes', () => {
    const bracketed = list.mosjes.filter((r: any) => r.name.startsWith('['));
    expect(bracketed.map((r: any) => r.name)).toEqual(['[...], The Hacker']);
  });

  it('costs: 11 at 2, 19 at 3, 2 at 4', () => {
    const n = (c: number) => list.mosjes.filter((r: any) => r.cost === c).length;
    expect([n(2), n(3), n(4)]).toEqual([11, 19, 2]);
  });

  it('exactly the 12 Phase-7 Mosjes are foil', () => {
    const foil = (MOSJES as any[]).filter((m) => m.foil === true).map((m) => m.id);
    expect([...foil].sort()).toEqual([...FOIL_MOSJE_IDS].sort());
    expect(foil).toHaveLength(12);
  });

  it('every holder text starts with "While " and names its partner', () => {
    for (const row of list.mosjes) {
      if (row.holderText == null) continue;
      expect(row.holderText.startsWith('While ')).toBe(true);
      expect(row.holderText).toContain(' is also on your field:');
    }
  });
});
