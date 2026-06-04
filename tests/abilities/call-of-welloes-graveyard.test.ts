// Phase 23 — Task 1 RED: effect_call_of_welloes + confirmCallOfWelloes read from graveyard
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_call_of_welloes } from '../../src/abilities/piecieEffects.js';
// @ts-expect-error — JS module, no type declarations
import { confirmCallOfWelloes } from '../../src/engine/turnManager.js';

const mosjeEntry1 = { cardId: 'mosje_jeffrey', name: 'Jeffrey', type: 'MOSJE', source: 'defeated', level: 1, mp: 50, statusEffects: [] as unknown[], isDefeated: true, traits: {} };
const mosjeEntry2 = { cardId: 'mosje_binti', name: 'Binti', type: 'MOSJE', source: 'defeated', level: 2, mp: 80, statusEffects: [] as unknown[], isDefeated: true, traits: {} };

function makeState(graveyard: unknown[] = [], activeSlots: unknown[] = [null, null], piecieSlots: unknown[] = [null, null, null, null]) {
  return {
    activePlayerId: 'player_1',
    players: {
      player_1: {
        id: 'player_1',
        hand: [] as unknown[],
        graveyard,
        activeSlots,
        deck: [] as unknown[],
        piecieSlots,
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
        attackPieciePlayedThisTurn: false,
      },
    },
  } as any;
}

describe('effect_call_of_welloes — reads from graveyard', () => {
  it('sets _callOfWelloesPending with welloeOptions from graveyard MOSJE entries', () => {
    const state = makeState(
      [{ ...mosjeEntry1 }, { ...mosjeEntry2 }],
      [{ cardId: 'mosje_a', name: 'A', mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [] }, null]
    );
    const result = effect_call_of_welloes(state, 'player_1');
    expect(result._callOfWelloesCancel).toBeUndefined();
    expect(result._callOfWelloesPending).toBeDefined();
    const opts = result._callOfWelloesPending.welloeOptions as any[];
    expect(opts).toHaveLength(2);
    expect(opts.map((o: any) => o.cardId)).toContain('mosje_jeffrey');
    expect(opts.map((o: any) => o.cardId)).toContain('mosje_binti');
  });

  it('returns _callOfWelloesCancel when no MOSJE entries in graveyard', () => {
    const state = makeState(
      [{ cardId: 'piecie_foo', name: 'Foo', type: 'PIECIE', source: 'played' }],
      [null, null]
    );
    const result = effect_call_of_welloes(state, 'player_1');
    expect(result._callOfWelloesCancel).toBe(true);
  });
});

describe('confirmCallOfWelloes — splices from graveyard', () => {
  it('places Mosje in active slot and removes it from graveyard', () => {
    const state = makeState(
      [{ ...mosjeEntry1 }],
      [{ cardId: 'mosje_a', name: 'A', mp: 80, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false }, null],
      [{ cardId: 'piecie_call_of_welloes', type: 'PIECIE' }, null, null, null]
    );
    const { state: s, success } = confirmCallOfWelloes(state, 'player_1', 'mosje_jeffrey');
    expect(success).toBe(true);
    const placed = (s.players.player_1.activeSlots as any[]).find((sl: any) => sl && sl.cardId === 'mosje_jeffrey');
    expect(placed).toBeDefined();
    // Removed from graveyard
    const gravMosjes = (s.players.player_1.graveyard as any[]).filter((e: any) => e.type === 'MOSJE');
    expect(gravMosjes).toHaveLength(0);
  });
});
