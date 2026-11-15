// Phase 53-06 (E29 umbrella): the visible card set is exactly the Card List 2.0.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { ALL_CARDS } from '../../src/data/cardIndex.js';

import { STARTER_NEW_NAMES, ARCHIVED_BY_2_1 } from '../helpers/starterSetIds';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const all = ALL_CARDS as any[];
const mappedIds: string[] = Object.values(CARD_ID_MAP).flatMap((m: any) => Object.values(m) as string[]);
const visible = all.filter((c) => !c.disabled);
const stars = (r: string) => (String(r).match(/★/g) || []).length;

describe('Card List 2.0 umbrella', () => {
  it('has 183 rows (32/38/73/20/20)', () => {
    expect([list.mosjes, list.quests, list.piecies, list.snelle, list.places].map((x: any[]) => x.length))
      .toEqual([32, 38, 73, 20, 20]);
    expect(mappedIds).toHaveLength(183);
  });

  it('every mapped id exists in ALL_CARDS', () => {
    for (const id of mappedIds) expect(all.find((c) => c.id === id), id).toBeTruthy();
  });

  // Phase 69: the visible set is the 10 Oct Card List minus the 22 archived cards (ARCHIVED_BY_2_1), plus the 17 new 2.1 starter cards and the 12 Personal Quests.
  it('visible cards == Card List cards - archived + 2.1 additions (bijection)', () => {
    const vis = new Set(visible.map((c) => c.id));
    const archived = mappedIds.filter((id) => all.find((c) => c.id === id)?.disabled);
    expect(archived.sort()).toEqual([...ARCHIVED_BY_2_1].sort());
    const added = visible.filter((c) => !mappedIds.includes(c.id));
    expect(added.filter((c) => c.type === 'PERSONAL_QUEST')).toHaveLength(12);
    const newCards = added.filter((c) => c.type !== 'PERSONAL_QUEST');
    expect(newCards.map((c) => c.name).sort()).toEqual([...STARTER_NEW_NAMES].sort());
    expect(mappedIds.filter((id) => !archived.includes(id) && !vis.has(id))).toEqual([]);
    expect(vis.size).toBe(183 - 22 + 17 + 12);
  });

  it('visible non-Quest cards have cost, 1-5 star rarity and limitPerDeck 1 or 2', () => {
    for (const c of visible.filter((x) => x.type !== 'QUEST' && x.type !== 'PERSONAL_QUEST')) {
      expect(typeof c.cost, `${c.id} cost`).toBe('number');
      expect(stars(c.rarity), `${c.id} rarity`).toBeGreaterThanOrEqual(1);
      expect(stars(c.rarity), `${c.id} rarity`).toBeLessThanOrEqual(5);
      expect([1, 2], `${c.id} limitPerDeck`).toContain(c.limitPerDeck);
    }
  });

  it('Blensen! carries costText', () => {
    const b = visible.find((c) => c.name === 'Blensen!');
    expect(b, 'Blensen!').toBeTruthy();
    expect(b.costText).toBeTruthy();
  });
});
