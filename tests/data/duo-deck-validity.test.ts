// ONBOARD-02 regression guard: every card ID in the 5 player-facing duo decks
// must resolve against the real card data. If a future deck edit introduces an
// unresolvable id, this suite fails.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
// @ts-expect-error — JS module, no type declarations
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from '../../src/data/piecies.js';
// @ts-expect-error — JS module, no type declarations
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-expect-error — JS module, no type declarations
import { PLACES } from '../../src/data/places.js';
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from '../../src/data/quests.js';

const KNOWN_IDS = new Set<string>(
  [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES, ...QUESTS].map(
    (card: { id: string }) => card.id,
  ),
);

type DeckDef = {
  id: string;
  mosjes: string[];
  piecies: string[];
  snellePiecies: string[];
  places: string[];
  quests: string[];
};

describe('duo-deck validity — all card ids resolve against real card data', () => {
  const decks: DeckDef[] = getPlayerFacingDecks();

  it('has 5 duo decks to validate', () => {
    expect(decks).toHaveLength(5);
  });

  for (const deck of decks) {
    it(`${deck.id}: every card id resolves`, () => {
      const allIds = [
        ...deck.mosjes,
        ...deck.piecies,
        ...deck.snellePiecies,
        ...deck.places,
        ...deck.quests,
      ];
      const unresolved = allIds.filter(id => !KNOWN_IDS.has(id));
      expect(unresolved).toEqual([]);
    });
  }
});
