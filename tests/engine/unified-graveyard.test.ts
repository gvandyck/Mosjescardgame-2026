// Phase 17 — Unified graveyard engine tests
// PLACE-REC-ENGINE-01/02/03
import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { setActivePlace, destroyActivePlace } from '../../src/engine/gameState.js';
// @ts-expect-error — JS module, no type declarations
import { markMosjeDefeated } from '../../src/engine/victoryChecker.js';

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    activePlace: null as string | null,
    activePlacePlayedBy: null as string | null,
    activePlaceTurnsActive: 0,
    activePlaceCanActivateOnTurn: 0,
    activePlayerId: 'player_1',
    turnNumber: 1,
    status: 'ACTIVE',
    _snelleFlags: {},
    players: {
      player_1: { discard: [] as unknown[], welloe: [] as unknown[], activeSlots: [null, null] },
      player_2: { discard: [] as unknown[], welloe: [] as unknown[], activeSlots: [null, null] },
    },
    ...overrides,
  };
}

describe('Unified graveyard — Place routing (PLACE-REC-ENGINE-01/02)', () => {
  it('setActivePlace sends replaced Place to owner discard', () => {
    const state = makeState({ activePlace: 'place_boxing_ring', activePlacePlayedBy: 'player_1' });
    const result = setActivePlace(state, 'place_quest_haven', 'player_2');
    expect(result.players.player_1.discard[0]).toMatchObject({ cardId: 'place_boxing_ring', type: 'PLACE' });
  });

  it('setActivePlace does NOT put replaced Place in sharedPlaceDiscard', () => {
    const state = makeState({ activePlace: 'place_boxing_ring', activePlacePlayedBy: 'player_1' });
    const result = setActivePlace(state, 'place_quest_haven', 'player_2');
    expect((result as any).sharedPlaceDiscard?.length ?? 0).toBe(0);
  });

  it('destroyActivePlace sends Place to owner discard', () => {
    const state = makeState({ activePlace: 'place_de_box', activePlacePlayedBy: 'player_2' });
    const result = destroyActivePlace(state);
    expect(result.players.player_2.discard[0]).toMatchObject({ cardId: 'place_de_box', type: 'PLACE' });
  });

  it('destroyActivePlace does NOT use sharedPlaceDiscard', () => {
    const state = makeState({ activePlace: 'place_de_box', activePlacePlayedBy: 'player_2' });
    const result = destroyActivePlace(state);
    expect((result as any).sharedPlaceDiscard?.length ?? 0).toBe(0);
  });

  it('setActivePlace falls back to activePlayerId when activePlacePlayedBy is null', () => {
    const state = makeState({ activePlace: 'place_boxing_ring', activePlacePlayedBy: null, activePlayerId: 'player_1' });
    const result = setActivePlace(state, 'place_quest_haven', 'player_2');
    expect(result.players.player_1.discard[0]).toMatchObject({ cardId: 'place_boxing_ring', type: 'PLACE' });
  });
});

describe('Unified graveyard — Mosje dual-write (PLACE-REC-ENGINE-03)', () => {
  function makeStateWithMosje() {
    return {
      activePlayerId: 'player_2',
      turnNumber: 1,
      status: 'ACTIVE',
      _snelleFlags: {},
      players: {
        player_1: { discard: [] as unknown[], welloe: [] as unknown[], activeSlots: [null] },
        player_2: {
          discard: [] as unknown[],
          welloe: [] as unknown[],
          activeSlots: [
            { cardId: 'mosje_binti', name: '[Binti]', mp: 5, level: 1, isDefeated: false, statusEffects: [], subtype: 'ARTISTIC', traits: {} },
            null,
          ],
        },
      },
    };
  }

  it('markMosjeDefeated still pushes full slot to player.welloe', () => {
    const state = makeStateWithMosje();
    const result = markMosjeDefeated(state, 'player_2', 0);
    expect(result.players.player_2.welloe[0]).toMatchObject({ cardId: 'mosje_binti', isDefeated: true });
  });

  it('markMosjeDefeated ALSO pushes type-tagged ref to player.discard', () => {
    const state = makeStateWithMosje();
    const result = markMosjeDefeated(state, 'player_2', 0);
    expect(result.players.player_2.discard).toContainEqual(
      expect.objectContaining({ cardId: 'mosje_binti', type: 'MOSJE' })
    );
  });
});
