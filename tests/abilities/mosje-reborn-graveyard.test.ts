// Phase 23 — Task 1 RED: effect_mosje_reborn reads from graveyard (not player.welloe)
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { effect_mosje_reborn } from '../../src/abilities/piecieEffects.js';

const mosjeGraveyardEntry = {
  cardId: 'mosje_jeffrey',
  name: 'Jeffrey',
  type: 'MOSJE',
  source: 'welloe',
  level: 1,
  mp: 50,
  statusEffects: [] as unknown[],
  isDefeated: true,
  traits: {},
};

function makeState(welloePile: unknown[] = [], activeSlots: unknown[] = [null, null]) {
  return {
    activePlayerId: 'player_1',
    players: {
      player_1: {
        id: 'player_1',
        hand: [] as unknown[],
        graveyard: [] as unknown[],
        welloePile,
        activeSlots,
        deck: [] as unknown[],
        piecieSlots: [null, null, null, null] as unknown[],
      },
    },
  };
}

describe('effect_mosje_reborn — reads from the Welloe pile', () => {
  it('revives first MOSJE entry from the Welloe pile into empty active slot', () => {
    const state = makeState([{ ...mosjeGraveyardEntry }], [null, null]);
    const asked = effect_mosje_reborn(state, 'player_1');
    asked.state.players.player_1._pendingTargets = { [asked.needChoice.key]: asked.needChoice.options[0] };
    const result = effect_mosje_reborn(asked.state, 'player_1');
    const slots = result.players.player_1.activeSlots as any[];
    const revived = slots.find((s: any) => s && s.cardId === 'mosje_jeffrey');
    expect(revived).toBeDefined();
    expect(revived.isDefeated).toBe(false);
    // Welloe pile entry removed
    const remaining = ((result.players.player_1 as any).welloePile as any[]).filter((e: any) => e.type === 'MOSJE');
    expect(remaining).toHaveLength(0);
  });

  it('returns state unchanged when the Welloe pile has no MOSJE entries', () => {
    const state = makeState([], [null, null]);
    const result = effect_mosje_reborn(state, 'player_1');
    const slots = result.players.player_1.activeSlots as any[];
    expect(slots[0]).toBeNull();
    expect(slots[1]).toBeNull();
  });

  it('does nothing while Welloe Graveyard is the active Place', () => {
    const state: any = makeState([{ ...mosjeGraveyardEntry }], [null, null]);
    state.activePlace = 'place_welloe_graveyard';
    const result = effect_mosje_reborn(state, 'player_1');
    expect(result.players.player_1.activeSlots).toEqual([null, null]);
    expect(result.players.player_1.welloePile).toHaveLength(1);
  });
});
