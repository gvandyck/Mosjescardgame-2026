import { test, assertEqual, assertTrue, assertFalse, assertDefined, createEngineState } from '../helpers/testHelpers.js';
import { getOpponentMosjes, getPlayerMosjes, getActiveMosjesForPlayer, getAllPlayerIds, getOpponentIds } from '../../src/engine/gameState.js';

export function runGameStateTests() {
  console.log('[TEST] Running gameState tests...');

  // ─── getPlayerMosjes ─────────────────────────────────────────

  test('getPlayerMosjes returns active own Mosjes with correct shape', () => {
    const state = createEngineState();
    const result = getPlayerMosjes(state, 'player_1');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'player_1_slot_0');
    assertEqual(result[0].cardId, 'mosje_west');
    assertEqual(result[0].owner, 'player_1');
    assertEqual(result[0].mpValue, 15);
    assertEqual(result[0].level, 1);
    assertDefined(result[0].label, 'label should be set');
  });

  test('getPlayerMosjes returns empty array when player has no active slots', () => {
    const state = createEngineState({
      players: { player_1: { activeSlots: [null, null] } },
    });
    const result = getPlayerMosjes(state, 'player_1');
    assertEqual(result.length, 0);
  });

  test('getPlayerMosjes excludes defeated Mosjes', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3 },
              mp: 0,
              level: 1,
              isDefeated: true,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });
    const result = getPlayerMosjes(state, 'player_1');
    assertEqual(result.length, 0);
  });

  test('getPlayerMosjes returns multiple Mosjes when both slots filled', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_gandoe',
              name: '[Gandoe] Prime',
              traits: { technical: 2 },
              mp: 22,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });
    const result = getPlayerMosjes(state, 'player_1');
    assertEqual(result.length, 2);
    assertEqual(result[0].id, 'player_1_slot_0');
    assertEqual(result[1].id, 'player_1_slot_1');
  });

  test('getPlayerMosjes returns empty array for unknown playerId', () => {
    const state = createEngineState();
    const result = getPlayerMosjes(state, 'player_99');
    assertEqual(result.length, 0);
  });

  // ─── getOpponentMosjes ───────────────────────────────────────

  test('getOpponentMosjes returns active opponent Mosjes with correct shape', () => {
    const state = createEngineState();
    const result = getOpponentMosjes(state, 'player_1');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'player_2_slot_0');
    assertEqual(result[0].cardId, 'mosje_jeffrey');
    assertEqual(result[0].owner, 'player_2');
    assertEqual(result[0].mpValue, 20);
    assertEqual(result[0].level, 1);
  });

  test('getOpponentMosjes returns empty array when opponent has no active slots', () => {
    const state = createEngineState({
      players: { player_2: { activeSlots: [null, null] } },
    });
    const result = getOpponentMosjes(state, 'player_1');
    assertEqual(result.length, 0);
  });

  test('getOpponentMosjes excludes defeated opponent Mosjes', () => {
    const state = createEngineState({
      players: {
        player_2: {
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3 },
              mp: 0,
              level: 1,
              isDefeated: true,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });
    const result = getOpponentMosjes(state, 'player_1');
    assertEqual(result.length, 0);
  });

  test('getOpponentMosjes does not include own Mosjes', () => {
    const state = createEngineState();
    const result = getOpponentMosjes(state, 'player_1');
    const hasOwnMosje = result.some(r => r.owner === 'player_1');
    assertFalse(hasOwnMosje, 'getOpponentMosjes should not include player_1 Mosjes');
  });

  test('getOpponentMosjes encodes slot index correctly in id', () => {
    const state = createEngineState({
      players: {
        player_2: {
          activeSlots: [
            null,
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });
    const result = getOpponentMosjes(state, 'player_1');
    assertEqual(result.length, 1);
    assertEqual(result[0].id, 'player_2_slot_1');
    assertEqual(result[0].slotIndex, 1);
  });

  // ─── getActiveMosjesForPlayer ────────────────────────────────

  test('getActiveMosjesForPlayer returns non-null, non-defeated slots', () => {
    const state = createEngineState();
    const result = getActiveMosjesForPlayer(state, 'player_1');
    assertEqual(result.length, 1);
    assertEqual(result[0].cardId, 'mosje_west');
  });

  test('getActiveMosjesForPlayer returns empty array for unknown player', () => {
    const state = createEngineState();
    const result = getActiveMosjesForPlayer(state, 'player_99');
    assertEqual(result.length, 0);
  });

  // ─── getAllPlayerIds / getOpponentIds ────────────────────────

  test('getAllPlayerIds returns all player keys', () => {
    const state = createEngineState();
    const ids = getAllPlayerIds(state);
    assertEqual(ids.length, 2);
    assertTrue(ids.includes('player_1'));
    assertTrue(ids.includes('player_2'));
  });

  test('getOpponentIds excludes the given player', () => {
    const state = createEngineState();
    const ids = getOpponentIds(state, 'player_1');
    assertEqual(ids.length, 1);
    assertEqual(ids[0], 'player_2');
  });
}
