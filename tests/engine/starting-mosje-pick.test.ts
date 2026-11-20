import { describe, it, expect, vi, afterEach } from 'vitest';
import { createInitialGameState } from '../../src/engine/gameState.js';
import { pickStartingMosje } from '../../src/engine/setup/pickStartingMosje.js';
import { STARTER_DECKS_21 } from '../../src/data/starterDecks21.js';
import { EXAMPLE_DECKS } from '../../src/data/exampleDecks.js';

const creative = STARTER_DECKS_21.find((d: any) => d.id === 'STARTER_CREATIVE') as any;
const count = (cards: any[], id: string) => cards.filter(c => c.cardId === id).length;

afterEach(() => vi.restoreAllMocks());

describe('pickStartingMosje(deckDef, chosenId) (72-13, D-15)', () => {
  it('returns the chosen id when it is one of the deck Mosjes', () => {
    expect(pickStartingMosje(creative, creative.mosjes[2])).toBe(creative.mosjes[2]);
  });

  it('ignores an id that is not in the deck (T-72-19)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(pickStartingMosje(creative, 'mosje_not_in_deck')).toBe(creative.mosjes[0]);
  });

  it('with no chosen id: fixed startingMosje, else random', () => {
    const ex = EXAMPLE_DECKS[0] as any;
    expect(pickStartingMosje(ex)).toBe(ex.startingMosje);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(pickStartingMosje(creative)).toBe(creative.mosjes[creative.mosjes.length - 1]);
  });
});

describe('createInitialGameState with a chosen starting Mosje', () => {
  const chosen = creative.mosjes[3];
  const make = (startingMosje: string | undefined) => createInitialGameState(
    [
      { playerId: 'p1', name: 'A', deckId: 'STARTER_CREATIVE', startingMosje },
      { playerId: 'p2', name: 'B', deckId: 'STARTER_PHYSICAL' },
    ],
    'T',
    { firstPlayerId: 'p1' },
  );

  it('puts the chosen Mosje on the field and one copy fewer in the draw deck and hand', () => {
    const p = make(chosen).players.p1;
    expect(p.activeSlots[0].cardId).toBe(chosen);
    expect(count(p.deck, chosen) + count(p.hand, chosen)).toBe(0);
    expect(p.deck.length + p.hand.length).toBe(39);
  });

  it('the other player is unaffected', () => {
    const q = make(chosen).players.p2;
    expect(q.activeSlots[0]).toBeTruthy();
    expect(q.deck.length + q.hand.length).toBe(39);
  });

  it('a foreign id falls back to a Mosje of the deck', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const p = make('mosje_not_in_deck').players.p1;
    expect(creative.mosjes).toContain(p.activeSlots[0].cardId);
  });

  it('the Example Deck with a fixed startingMosje still starts with it', () => {
    const ex = EXAMPLE_DECKS[0] as any;
    const s = createInitialGameState(
      [{ playerId: 'p1', name: 'A', deckId: ex.id }, { playerId: 'p2', name: 'B', deckId: ex.id }],
      'T',
      { firstPlayerId: 'p1' },
    );
    expect(s.players.p1.activeSlots[0].cardId).toBe(ex.startingMosje);
  });
});
