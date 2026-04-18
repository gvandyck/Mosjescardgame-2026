import {
  test,
  assertEqual,
  assertTrue,
  createEngineState,
} from '../helpers/testHelpers.js';
import { gainMP, loseMP, checkLevelUp } from '../../src/engine/mpManager.js';

export function runMpManagerTests() {
  console.log('[TEST] Running mpManager tests...');

  test('gainMP adds MP to target Mosje slot', () => {
    const state = createEngineState();
    const result = gainMP(state, 'player_1', 0, 25);
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('gainMP does not change opponent MP', () => {
    const state = createEngineState();
    const result = gainMP(state, 'player_1', 0, 25);
    assertEqual(result.players.player_2.activeSlots[0].mp, 20);
  });

  test('loseMP subtracts MP from target Mosje', () => {
    const state = createEngineState();
    const result = loseMP(state, 'player_1', 0, 10);
    assertEqual(result.players.player_1.activeSlots[0].mp, 5);
  });

  test('loseMP allows negative MP', () => {
    const state = createEngineState();
    const result = loseMP(state, 'player_1', 0, 30);
    assertEqual(result.players.player_1.activeSlots[0].mp, -15);
  });

  test('checkLevelUp levels when MP reaches 100+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 100,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const result = checkLevelUp(state, 'player_1', 0);
    assertEqual(result.players.player_1.activeSlots[0].level, 2);
    assertEqual(result.players.player_1.activeSlots[0].mp, 0);
  });

  test('checkLevelUp keeps level unchanged below 100 MP', () => {
    const state = createEngineState();
    const result = checkLevelUp(state, 'player_1', 0);
    assertEqual(result.players.player_1.activeSlots[0].level, 1);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('gainMP chained leveling can reach Level 3', () => {
    let state = createEngineState();
    state = gainMP(state, 'player_1', 0, 90);
    state = gainMP(state, 'player_1', 0, 90);
    state = gainMP(state, 'player_1', 0, 90);
    state = gainMP(state, 'player_1', 0, 90);
    assertTrue(state.players.player_1.activeSlots[0].level >= 3);
  });
}
