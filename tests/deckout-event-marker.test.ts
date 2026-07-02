// deckout-event-marker.test.ts — Phase 33
// The D-06 deck-out reshuffle must stamp a one-shot _deckOutEvent marker (for the UI
// recycle notice) WITHOUT changing the existing reshuffle + skip-next-turn penalty.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { phaseDrawCard } from '../src/engine/turnManager.js';

function stateWithEmptyDeck(playerId = 'player_1') {
  return {
    turnNumber: 4,
    players: {
      [playerId]: {
        deck: [],
        graveyard: ['piecie_affoe', 'piecie_kannetje_melk'],
        hand: [],
        drawsThisTurn: 0,
        skipNextTurn: false,
      },
    },
  };
}

describe('deck-out event marker (D-06 visibility)', () => {
  it('stamps _deckOutEvent with playerId + turnNumber on reshuffle', () => {
    const out = phaseDrawCard(stateWithEmptyDeck(), 'player_1');
    expect(out._deckOutEvent?.playerId).toBe('player_1');
    expect(out._deckOutEvent?.turnNumber).toBe(4);
    expect(out._deckOutEvent?.reshuffledCount).toBeGreaterThan(0);
  });

  it('still arms the skip-next-turn penalty (no regression to D-06)', () => {
    const out = phaseDrawCard(stateWithEmptyDeck(), 'player_1');
    expect(out.players.player_1.skipNextTurn).toBe(true);
    expect(out.players.player_1.hand.length).toBe(1);
  });

  it('does NOT stamp the marker when deck AND discard are both empty', () => {
    const s = stateWithEmptyDeck();
    s.players.player_1.graveyard = [];
    const out = phaseDrawCard(s, 'player_1');
    expect(out._deckOutEvent).toBeUndefined();
    expect(out.players.player_1.skipNextTurn).toBe(false);
  });
});
