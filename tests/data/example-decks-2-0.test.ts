// Phase 53-07 (E30): the 3 Example Decks match the Example Decks doc and obey the deck rules.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseExampleDecks } from '../../scripts/obby2/parseExampleDecks.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { getCardById } from '../../src/data/cardIndex.js';
// @ts-ignore JS module
import { getCopyLimit } from '../../src/data/getCopyLimit.js';
// @ts-ignore JS module
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-ignore JS module
import { buildDeck } from '../../src/engine/deckEngine.js';

const docDecks = parseExampleDecks(readDoc('Obby Card Game 2.0 - Example Decks.md')) as any[];
const IDS: Record<string, string> = {
  taksen: 'EXAMPLE_TAKSEN',
  regelaars: 'EXAMPLE_REGELAARS',
  creatievelingen: 'EXAMPLE_CREATIEVELINGEN',
};
const mapKey = (kind: string) =>
  kind.startsWith('Mosje') ? 'mosjes' : kind.startsWith('Place') ? 'places' : kind.startsWith('Snelle') ? 'snelle' : 'piecies';
const field = (k: string) => (k === 'snelle' ? 'snellePiecies' : k);

describe('Example Decks 2.0 (E30)', () => {
  it('doc has 3 decks', () => {
    expect(docDecks.map((d) => d.key)).toEqual(['taksen', 'regelaars', 'creatievelingen']);
  });

  for (const doc of docDecks) {
    describe(doc.name, () => {
      const deck = (STARTER_DECKS as any[]).find((d) => d.id === IDS[doc.key]);

      it('exists with doc name and kind', () => {
        expect(deck, IDS[doc.key]).toBeTruthy();
        expect(deck.name).toBe(doc.name);
        expect(deck.kind).toBe(doc.kind);
      });

      const all = () => [
        ...deck.mosjes, ...deck.piecies, ...deck.snellePiecies, ...deck.places, ...deck.quests,
      ] as string[];

      it('has 30 cards, per-id counts equal the doc', () => {
        expect(all()).toHaveLength(30);
        for (const e of doc.entries) {
          const k = mapKey(e.kind);
          const id = CARD_ID_MAP[k][e.name];
          expect(id, `${e.name} unmapped`).toBeTruthy();
          const n = (deck[field(k)] as string[]).filter((x) => x === id).length;
          expect(n, e.name).toBe(e.qty);
        }
        expect(doc.entries.reduce((s: number, e: any) => s + e.qty, 0)).toBe(30);
      });

      it('respects copy limits, no disabled cards', () => {
        const counts: Record<string, number> = {};
        for (const id of all()) counts[id] = (counts[id] ?? 0) + 1;
        for (const [id, n] of Object.entries(counts)) {
          const card = getCardById(id);
          expect(card, id).toBeTruthy();
          expect(card.disabled, id).toBeFalsy();
          expect(n, id).toBeLessThanOrEqual(getCopyLimit(card));
          expect(n, id).toBeLessThanOrEqual(2);
        }
      });

      it('starting Mosje is the doc start and is in mosjes', () => {
        expect(deck.startingMosje).toBe(CARD_ID_MAP.mosjes[doc.startingMosjeName]);
        expect(deck.mosjes).toContain(deck.startingMosje);
        expect(deck.mosjes).toHaveLength(6);
      });

      it('doc cost and tag columns agree with the data', () => {
        for (const e of doc.entries) {
          const card = getCardById(CARD_ID_MAP[mapKey(e.kind)][e.name]);
          const expectedCost = e.cost.includes('or free') ? card.costText : Number(e.cost);
          if (e.cost.includes('or free')) expect(card.costText).toBeTruthy();
          else expect(card.cost, e.name).toBe(expectedCost);
          const tag = e.kind.split('·')[1]?.trim();
          if (tag) expect(card.tag, e.name).toBe(tag);
        }
      });

      it('buildDeck returns exactly 30 cards', () => {
        expect(buildDeck(deck)).toHaveLength(30);
      });
    });
  }
});
