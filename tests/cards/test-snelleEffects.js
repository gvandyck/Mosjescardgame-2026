import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as snelleEffects from '../../src/abilities/snelleEffects.js';

export function runSnelleEffectsTests() {
  console.log('[TEST] Running snelleEffects tests...');

  test('Snelle effects module exists', () => {
    assertDefined(snelleEffects, 'snelleEffects module failed to load');
  });

  test('Jensen returns cloned state without mutating original', () => {
    assertDefined(
      snelleEffects.effect_jensen,
      'effect_jensen missing'
    );
    const state = createEngineState();
    const result = snelleEffects.effect_jensen(state);
    assertEqual(result !== state, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Lucky Coin returns cloned state without changing MP', () => {
    assertDefined(
      snelleEffects.effect_lucky_coin,
      'effect_lucky_coin missing'
    );
    const state = createEngineState();
    const result = snelleEffects.effect_lucky_coin(state);
    assertEqual(result !== state, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Emergency Healings gives +25 MP normally', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_emergency_healings(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('Emergency Healings gives +35 MP when resilient is 2+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_michelle',
              name: '[Michelle] Iron Tuk',
              traits: { physical: 2, resilient: 2 },
              mp: 10,
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

    const result = snelleEffects.effect_emergency_healings(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 45);
  });

  test('FF Haaltje Nemen adds incoming MP loss reduction status', () => {
    const state = createEngineState();
    const result = snelleEffects.effect_ff_haaltje_nemen(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].statusEffects.length, 1);
    assertEqual(result.players.player_1.activeSlots[0].statusEffects[0].type, 'MP_LOSS_REDUCTION');
    assertEqual(result.players.player_1.activeSlots[0].statusEffects[0].value, 20);
  });
}
