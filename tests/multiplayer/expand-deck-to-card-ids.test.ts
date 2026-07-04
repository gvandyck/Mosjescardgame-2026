// ONBOARD-03: expandDeckToCardIds turns a deck def into the flat card-id
// multiset used for the exact-count collection grant. Duplicates preserved.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { expandDeckToCardIds } from '../../src/multiplayer/expandDeckToCardIds.js';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';

type DeckDef = {
  id: string;
  mosjes: string[];
  piecies: string[];
  snellePiecies: string[];
  places: string[];
  quests: string[];
};

const coertBinti: DeckDef = STARTER_DECKS.find(
  (d: DeckDef) => d.id === 'DUO_COERT_BINTI',
);

describe('expandDeckToCardIds()', () => {
  it('DUO_COERT_BINTI expands to exactly 19 card ids', () => {
    expect(expandDeckToCardIds(coertBinti)).toHaveLength(19);
  });

  it('preserves duplicates: DUO_COERT_BINTI has 3x piecie_kannetje_melk', () => {
    const ids: string[] = expandDeckToCardIds(coertBinti);
    expect(ids.filter(id => id === 'piecie_kannetje_melk')).toHaveLength(3);
  });

  it('concatenates in order: mosjes, piecies, snellePiecies, places, quests', () => {
    const ids: string[] = expandDeckToCardIds(coertBinti);
    expect(ids).toEqual([
      ...coertBinti.mosjes,
      ...coertBinti.piecies,
      ...coertBinti.snellePiecies,
      ...coertBinti.places,
      ...coertBinti.quests,
    ]);
  });

  it('every duo deck expands to 19 cards', () => {
    for (const deck of getPlayerFacingDecks() as DeckDef[]) {
      expect(expandDeckToCardIds(deck)).toHaveLength(19);
    }
  });

  it('treats missing sub-arrays as empty', () => {
    const partial = { mosjes: ['mosje_binti'], quests: ['quest_inspire_crowd'] };
    expect(expandDeckToCardIds(partial)).toEqual([
      'mosje_binti',
      'quest_inspire_crowd',
    ]);
  });

  it('does not mutate the deck definition', () => {
    const before = JSON.stringify(coertBinti);
    expandDeckToCardIds(coertBinti);
    expect(JSON.stringify(coertBinti)).toBe(before);
  });
});
