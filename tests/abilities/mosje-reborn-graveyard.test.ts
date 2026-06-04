// Phase 23 — Task 1 RED: effect_mosje_reborn reads from graveyard (not player.welloe)
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_mosje_reborn } from '../../src/abilities/piecieEffects.js';

const mosjeGraveyardEntry = {
  cardId: 'mosje_jeffrey',
  name: 'Jeffrey',
  type: 'MOSJE',
  source: 'defeated',
  level: 1,
  mp: 50,
  statusEffects: [] as unknown[],
  isDefeated: true,
  traits: {},
};

function makeState(graveyard: unknown[] = [], activeSlots: unknown[] = [null, null]) {
  return {
    activePlayerId: 'player_1',
    players: {
      player_1: {
        id: 'player_1',
        hand: [] as unknown[],
        graveyard,
        activeSlots,
        deck: [] as unknown[],
        piecieSlots: [null, null, null, null] as unknown[],
      },
    },
  };
}

describe('effect_mosje_reborn — reads from graveyard', () => {
  it('revives first MOSJE entry from graveyard into empty active slot', () => {
    const state = makeState([{ ...mosjeGraveyardEntry }], [null, null]);
    const result = effect_mosje_reborn(state, 'player_1');
    const slots = result.players.player_1.activeSlots as any[];
    const revived = slots.find((s: any) => s && s.cardId === 'mosje_jeffrey');
    expect(revived).toBeDefined();
    expect(revived.isDefeated).toBe(false);
    // Graveyard entry removed
    const remaining = (result.players.player_1.graveyard as any[]).filter((e: any) => e.type === 'MOSJE');
    expect(remaining).toHaveLength(0);
  });

  it('returns state unchanged when graveyard has no MOSJE entries', () => {
    const state = makeState([], [null, null]);
    const result = effect_mosje_reborn(state, 'player_1');
    const slots = result.players.player_1.activeSlots as any[];
    expect(slots[0]).toBeNull();
    expect(slots[1]).toBeNull();
  });
});
