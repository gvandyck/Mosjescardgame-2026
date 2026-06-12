// Phase 23 — Task 1 RED: graveyardUtils helpers
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { toGraveyardEntry, addToGraveyard, getGraveyardByType } from '../../src/engine/graveyardUtils.js';

// NOTE: allCardData parameter removed — graveyardUtils now builds its own internal lookup.

function makeState(graveyard: unknown[] = []) {
  return {
    players: {
      p1: { id: 'p1', hand: [] as unknown[], graveyard, activeSlots: [null, null], deck: [] as unknown[], piecieSlots: [null, null, null, null] },
    },
  };
}

describe('toGraveyardEntry', () => {
  it('returns object with cardId, name, type, source for known card', () => {
    // piecie_ronald_kip exists in the real PIECIES data
    const entry = toGraveyardEntry('piecie_ronald_kip', 'discarded');
    expect(entry).toMatchObject({ cardId: 'piecie_ronald_kip', type: 'PIECIE', source: 'discarded' });
  });

  it('falls back to HAND_CARD type for unknown card', () => {
    const entry = toGraveyardEntry('unknown_card', 'discarded');
    expect(entry.type).toBe('HAND_CARD');
    expect(entry.cardId).toBe('unknown_card');
    expect(entry.source).toBe('discarded');
  });
});

describe('addToGraveyard', () => {
  it('returns new state with entry appended to player graveyard', () => {
    const state = makeState([]);
    const newState = addToGraveyard(state, 'p1', 'piecie_ronald_kip', 'played');
    expect(newState.players.p1.graveyard).toHaveLength(1);
    expect(newState.players.p1.graveyard[0]).toMatchObject({ cardId: 'piecie_ronald_kip', type: 'PIECIE', source: 'played' });
  });

  it('does NOT mutate original state', () => {
    const state = makeState([]);
    addToGraveyard(state, 'p1', 'piecie_ronald_kip', 'played');
    expect(state.players.p1.graveyard).toHaveLength(0);
  });
});

describe('getGraveyardByType', () => {
  it('returns only entries of the specified type', () => {
    const player = {
      graveyard: [
        { cardId: 'mosje_jeffrey', type: 'MOSJE', source: 'defeated' },
        { cardId: 'piecie_ronald_kip', type: 'PIECIE', source: 'played' },
      ],
    };
    const result = getGraveyardByType(player, 'MOSJE');
    expect(result).toHaveLength(1);
    expect(result[0].cardId).toBe('mosje_jeffrey');
  });

  it('returns [] for empty graveyard', () => {
    const player = { graveyard: [] };
    expect(getGraveyardByType(player, 'MOSJE')).toEqual([]);
  });

  it('returns [] when graveyard is absent', () => {
    const player = {};
    expect(getGraveyardByType(player, 'MOSJE')).toEqual([]);
  });
});
