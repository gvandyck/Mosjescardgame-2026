// Phase 23 — Task 1 RED: effect_those_eyelashes sends discarded hand cards to holder's graveyard
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_those_eyelashes } from '../../src/abilities/piecieEffects.js';

function makeState() {
  return {
    activePlayerId: 'player_1',
    _snelleFlags: {},
    players: {
      player_1: {
        id: 'player_1',
        hand: [] as unknown[],
        graveyard: [] as unknown[],
        activeSlots: [
          // Martin/West required for Those Eyelashes to fire
          { cardId: 'mosje_martin', name: 'Martin', mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [] },
          null,
        ],
        deck: [] as unknown[],
        piecieSlots: [null, null, null, null],
      },
      player_2: {
        id: 'player_2',
        hand: [
          { cardId: 'piecie_foo', name: 'Foo', type: 'PIECIE' },
          { cardId: 'piecie_bar', name: 'Bar', type: 'PIECIE' },
        ] as unknown[],
        graveyard: [] as unknown[],
        activeSlots: [
          { cardId: 'mosje_b', name: 'B', mp: 70, level: 1, isDefeated: false, traits: {}, statusEffects: [] },
          null,
        ],
        deck: [] as unknown[],
        piecieSlots: [null, null, null, null],
      },
    },
  } as any;
}

describe('effect_those_eyelashes — discarded card appears in holder graveyard', () => {
  // Phase 59 (Card List 2.0): the opponent chooses which card they discard (a pause answered via _pendingTargets).
  it('opponent loses the card they choose and it appears in their graveyard', () => {
    const state = makeState();
    state.players.player_2._pendingTargets = { eyelash_discard: { cardId: 'piecie_foo' } };
    const result = effect_those_eyelashes(state, 'player_1', { eyeSlot: 0 });
    const opp = result.players.player_2;
    // Hand is smaller
    expect(opp.hand).toHaveLength(1);
    // Graveyard gained an entry
    expect(opp.graveyard).toHaveLength(1);
    const entry = (opp.graveyard as any[])[0];
    expect(entry.cardId).toBe('piecie_foo');
    expect(entry.source).toBe('discarded');
  });

  it('graveyard entry has type set', () => {
    const state = makeState();
    state.players.player_2._pendingTargets = { eyelash_discard: { cardId: 'piecie_foo' } };
    const result = effect_those_eyelashes(state, 'player_1', { eyeSlot: 0 });
    const entry = (result.players.player_2.graveyard as any[])[0];
    expect(entry.type).toBeDefined();
  });
});
