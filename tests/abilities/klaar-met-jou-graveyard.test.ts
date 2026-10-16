// Klaar Met Jou (Card List 2.0): send one opponent Mosje with 30 MP or less to the Welloe pile, draw 1 card.
// (Replaces the V4 "-40 MP and discard the last hand card" test of Phase 23.)
import { describe, it, expect } from 'vitest';
// @ts-expect-error - JS module, no type declarations
import { effect_klaar_met_jou } from '../../src/abilities/piecieEffects.js';

function makeState(oppMp: number) {
  const mosje = (cardId: string, mp: number) => ({ cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [] });
  return {
    activePlayerId: 'player_1', turnNumber: 4, status: 'PLAYING', _pendingTargets: {},
    players: {
      player_1: { id: 'player_1', hand: [] as unknown[], deck: [{ cardId: 'piecie_foo', type: 'PIECIE' }] as unknown[], graveyard: [] as unknown[],
        activeSlots: [mosje('mosje_a', 80), null], piecieSlots: [null, null, null, null] },
      player_2: { id: 'player_2', hand: [{ cardId: 'piecie_bar', type: 'PIECIE' }] as unknown[], deck: [] as unknown[], graveyard: [] as unknown[],
        welloePile: [] as unknown[], activeSlots: [mosje('mosje_b', oppMp), mosje('mosje_c', 60)], piecieSlots: [null, null, null, null] },
    },
  } as any;
}

describe('effect_klaar_met_jou - Welloe pile', () => {
  it('a Mosje with 30 MP goes to the Welloe pile and the owner draws 1; the foe hand is untouched', () => {
    const result = effect_klaar_met_jou(makeState(30), 'player_1');
    const opp = result.players.player_2;
    expect(opp.activeSlots[0]).toBeNull();
    expect(opp.welloePile).toHaveLength(1);
    expect(opp.welloePile[0].cardId).toBe('mosje_b');
    expect(opp.hand).toHaveLength(1);
    expect(result.players.player_1.hand).toHaveLength(1);
  });

  it('a Mosje above 30 MP is not sent (the limit is re-checked in the effect)', () => {
    const state = makeState(35);
    state._pendingTargets = { opp_slot_index: 0 };
    const result = effect_klaar_met_jou(state, 'player_1');
    expect(result.players.player_2.activeSlots[0]).not.toBeNull();
    expect(result.players.player_2.welloePile).toHaveLength(0);
  });
});
