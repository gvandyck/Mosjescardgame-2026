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

  test('The Void blocks gainMP and loseMP', () => {
    const state = createEngineState({ activePlace: 'place_the_void' });
    const afterGain = gainMP(state, 'player_1', 0, 20);
    const afterLoss = loseMP(afterGain, 'player_1', 0, 10);
    assertEqual(afterLoss.players.player_1.activeSlots[0].mp, 15);
  });

  test('Momentum Factory blocks ATTACK loss only', () => {
    const state = createEngineState({ activePlace: 'place_momentum_factory' });
    const blocked = loseMP(state, 'player_1', 0, 30, 'ATTACK');
    const allowed = loseMP(state, 'player_1', 0, 30, 'DRAIN');
    assertEqual(blocked.players.player_1.activeSlots[0].mp, 15);
    assertEqual(allowed.players.player_1.activeSlots[0].mp, -15);
  });

  test('Drain Zone boosts gain and DRAIN loss', () => {
    const state = createEngineState({ activePlace: 'place_drain_zone' });
    const afterGain = gainMP(state, 'player_1', 0, 10);
    const afterDrain = loseMP(afterGain, 'player_1', 0, 20, 'DRAIN');
    assertEqual(afterGain.players.player_1.activeSlots[0].mp, 30); // +15
    assertEqual(afterDrain.players.player_1.activeSlots[0].mp, 0); // -30
  });
}
