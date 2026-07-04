// ONBOARD-04: resolveActiveDeck picks the player's active deck from their
// saved decks, defaulting to the first deck when activeDeckId is absent
// (migration-safe for accounts created before Phase 34).
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { resolveActiveDeck } from '../../src/multiplayer/resolveActiveDeck.js';

const deckA = { id: 'DUO_COERT_BINTI', name: 'Coert & Binti' };
const deckB = { id: 'DUO_WEST_CLESS', name: 'West & Cless' };
const decks = [deckA, deckB];

describe('resolveActiveDeck()', () => {
  it('returns the deck matching activeDeckId', () => {
    expect(resolveActiveDeck(decks, 'DUO_WEST_CLESS')).toBe(deckB);
  });

  it('returns the first deck when activeDeckId is null', () => {
    expect(resolveActiveDeck(decks, null)).toBe(deckA);
  });

  it('returns the first deck when activeDeckId is undefined', () => {
    expect(resolveActiveDeck(decks, undefined)).toBe(deckA);
  });

  it('returns the first deck when activeDeckId matches no deck', () => {
    expect(resolveActiveDeck(decks, 'NOT_A_DECK')).toBe(deckA);
  });

  it('returns null when decks is empty', () => {
    expect(resolveActiveDeck([], 'DUO_COERT_BINTI')).toBeNull();
  });

  it('returns null when decks is null/undefined', () => {
    expect(resolveActiveDeck(null, 'DUO_COERT_BINTI')).toBeNull();
    expect(resolveActiveDeck(undefined, null)).toBeNull();
  });
});
