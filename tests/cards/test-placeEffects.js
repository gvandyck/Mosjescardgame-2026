import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as placeEffects from '../../src/abilities/placeEffects.js';

export function runPlaceEffectsTests() {
  console.log('[TEST] Running placeEffects tests...');

  test('Place effects module exists', () => {
    assertDefined(placeEffects, 'placeEffects module failed to load');
  });

  test('The Gym applies trait-based MP changes', () => {
    assertDefined(
      placeEffects.effect_the_gym,
      'effect_the_gym missing'
    );

    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3, resilient: 1 },
              mp: 20,
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

    const result = placeEffects.effect_the_gym(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 5);  // non-physical loses 10
    assertEqual(result.players.player_2.activeSlots[0].mp, 55); // physical 3 gains 35
  });

  test('Quest Haven grants +25 when two quests completed in turn', () => {
    assertDefined(
      placeEffects.effect_quest_haven,
      'effect_quest_haven missing'
    );

    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
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

    const result = placeEffects.effect_quest_haven(state, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('Quest Haven does not change MP without two-quest trigger', () => {
    const state = createEngineState();
    const result = placeEffects.effect_quest_haven(state, false);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Bank Chilling gives +15 when drawing 2+ and mental is 2+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
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

    const result = placeEffects.effect_bank_chilling(state, 'player_1', 2);
    assertEqual(result.players.player_1.activeSlots[0].mp, 30);
  });

  test('Bank Chilling gives no bonus when fewer than 2 cards are drawn', () => {
    const state = createEngineState();
    const result = placeEffects.effect_bank_chilling(state, 'player_1', 1);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });
}
