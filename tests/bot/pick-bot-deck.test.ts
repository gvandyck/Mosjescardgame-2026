// ONBOARD-06: pickBotDeck — the bot/opponent deck is a TRUE-RANDOM pick from
// the provided pool (mirror allowed — the player's own deck is never excluded).
// Every call site passes getPlayerFacingDecks(), so the bot can only ever play
// one of the 5 duo decks and never an original (PHYSICAL_FORCE /
// DIGITAL_CONTROL / ARTISTIC_RHYTHM).
import { afterEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { pickBotDeck } from '../../src/bot/pickBotDeck.js';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';

const ORIGINALS = ['PHYSICAL_FORCE', 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM'];

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pickBotDeck()', () => {
  it('returns a deterministic element with a stubbed Math.random', () => {
    const decks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const spy = vi.spyOn(Math, 'random');

    spy.mockReturnValue(0);
    expect(pickBotDeck(decks)).toBe(decks[0]);

    spy.mockReturnValue(0.5);
    expect(pickBotDeck(decks)).toBe(decks[1]);

    spy.mockReturnValue(0.999);
    expect(pickBotDeck(decks)).toBe(decks[2]);
  });

  it('only ever returns one of the provided decks, and reaches ALL of them (uniform-ish sweep)', () => {
    const decks: Array<{ id: string }> = getPlayerFacingDecks();
    const duoIds = decks.map(d => d.id);
    const spy = vi.spyOn(Math, 'random');
    const seen = new Set<string>();

    for (let i = 0; i < 100; i++) {
      spy.mockReturnValue(i / 100);
      const picked = pickBotDeck(decks);
      expect(duoIds).toContain(picked.id);
      seen.add(picked.id);
    }

    // True-random over the whole pool: every duo deck must be reachable.
    expect(seen).toEqual(new Set(duoIds));
  });

  it('never returns an original deck id from the player-facing pool', () => {
    const decks = getPlayerFacingDecks();
    const spy = vi.spyOn(Math, 'random');

    for (let i = 0; i < 50; i++) {
      spy.mockReturnValue(i / 50);
      const picked = pickBotDeck(decks);
      expect(ORIGINALS).not.toContain(picked.id);
      expect(picked.id.startsWith('DUO_')).toBe(true);
    }
  });

  it('allows a mirror match — the "player deck" stays in the pool and can be picked', () => {
    const decks: Array<{ id: string }> = getPlayerFacingDecks();
    const playerDeckIndex = 2;
    const playerDeckId = decks[playerDeckIndex].id;

    // Stub random so the pick lands exactly on the player's own deck.
    vi.spyOn(Math, 'random').mockReturnValue(playerDeckIndex / decks.length);
    expect(pickBotDeck(decks).id).toBe(playerDeckId);
  });

  it('returns null for an empty or missing pool', () => {
    expect(pickBotDeck([])).toBeNull();
    expect(pickBotDeck(undefined)).toBeNull();
    expect(pickBotDeck(null)).toBeNull();
  });
});
