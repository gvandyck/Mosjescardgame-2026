// Phase 23 — Task 1 RED: effect_klaar_met_jou sends discarded hand card to opponent graveyard
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_klaar_met_jou } from '../../src/abilities/piecieEffects.js';

function makeState() {
  return {
    activePlayerId: 'player_1',
    players: {
      player_1: {
        id: 'player_1',
        hand: [] as unknown[],
        graveyard: [] as unknown[],
        activeSlots: [
          { cardId: 'mosje_a', name: 'A', mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [] },
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
          { cardId: 'piecie_baz', name: 'Baz', type: 'PIECIE' },
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

describe('effect_klaar_met_jou — discarded card appears in opponent graveyard', () => {
  it('opponent loses last hand card and it appears in their graveyard', () => {
    const state = makeState();
    const result = effect_klaar_met_jou(state, 'player_1');
    const opp = result.players.player_2;
    // Hand is smaller
    expect(opp.hand).toHaveLength(2);
    // Graveyard gained an entry
    expect(opp.graveyard).toHaveLength(1);
    const entry = (opp.graveyard as any[])[0];
    expect(entry.cardId).toBe('piecie_baz');
    expect(entry.source).toBe('discarded');
  });

  it('graveyard entry has type set', () => {
    const state = makeState();
    const result = effect_klaar_met_jou(state, 'player_1');
    const entry = (result.players.player_2.graveyard as any[])[0];
    expect(entry.type).toBeDefined();
  });
});
