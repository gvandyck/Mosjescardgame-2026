import { test, assertEqual, assertTrue, createEngineState } from '../helpers/testHelpers.js';
import { checkVictory, markMosjeDefeated } from '../../src/engine/victoryChecker.js';

export function runVictoryCheckerTests() {
  console.log('[TEST] Running victoryChecker tests...');

  test('Victory: no winner on clean state', () => {
    const state = createEngineState();
    const result = checkVictory(state);
    assertEqual(result.winnerId, null);
  });

  test('Victory: Level 3 win', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 3,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const result = checkVictory(state);
    assertEqual(result.winnerId, 'player_1');
  });

  test('Victory: Knockout when opponent slots are empty', () => {
    const state = createEngineState({
      players: {
        player_2: {
          activeSlots: [null, null],
        },
      },
    });

    const result = checkVictory(state);
    assertEqual(result.winnerId, 'player_1');
  });

  test('Victory: Quest Master at 7 quests', () => {
    const state = createEngineState({
      players: {
        player_1: {
          questsCompleted: 7,
        },
      },
    });

    const result = checkVictory(state);
    assertEqual(result.winnerId, 'player_1');
  });

  test('Victory: Momentum Domination at 250+ MP on turn-start check', () => {
    const state = createEngineState({
      momentumCheckPhase: true,
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 130,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { mental: 2, technical: 3 },
              mp: 125,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });

    const result = checkVictory(state);
    assertEqual(result.winnerId, 'player_1');
  });

  // ── Not Today! (negateNextElimination) ─────────────────────
  test('markMosjeDefeated: Not Today! saves Mosje at 5 MP', () => {
    const state = createEngineState({
      _snelleFlags: {
        negateNextElimination: { player_1: true }
      }
    });
    const result = markMosjeDefeated(state, 'player_1', 0);
    assertEqual(result.players.player_1.activeSlots[0].mp, 5, 'Mosje should be at 5 MP after Not Today!');
    assertTrue(!result.players.player_1.activeSlots[0].isDefeated, 'Mosje should NOT be marked defeated');
    assertEqual(result.players.player_1.welloe.length, 0, 'Mosje should NOT be in Welloe pile');
  });

  test('markMosjeDefeated: without flag, Mosje is sent to Welloe pile', () => {
    const state = createEngineState();
    const result = markMosjeDefeated(state, 'player_1', 0);
    assertEqual(result.players.player_1.activeSlots[0], null, 'Slot should be null after defeat');
    assertEqual(result.players.player_1.welloe.length, 1, 'Mosje should be in Welloe pile');
  });
}
