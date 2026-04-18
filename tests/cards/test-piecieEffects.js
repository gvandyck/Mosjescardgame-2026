import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as piecieEffects from '../../src/abilities/piecieEffects.js';

export function runPiecieEffectsTests() {
  console.log('[TEST] Running piecieEffects tests...');

  test('Piecie effects module exists', () => {
    assertDefined(piecieEffects, 'piecieEffects module failed to load');
  });

  test('Kannetje Melk grants +25 MP to active Mosje', () => {
    assertDefined(
      piecieEffects.effect_kannetje_melk,
      'effect_kannetje_melk missing'
    );
    const state = createEngineState();
    const result = piecieEffects.effect_kannetje_melk(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('Affoe applies opponent -15 MP and self +10 MP', () => {
    assertDefined(
      piecieEffects.effect_affoe,
      'effect_affoe missing'
    );
    const state = createEngineState();
    const result = piecieEffects.effect_affoe(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 25);
    assertEqual(result.players.player_2.activeSlots[0].mp, 5);
  });

  test('Broodje Doner gives +35 MP when level is 1+', () => {
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

    const result = piecieEffects.effect_broodje_doner(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 50);
  });

  test('Broodje Doner does nothing when level is below 1', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 0,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const result = piecieEffects.effect_broodje_doner(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Gun een Piece draws 2 cards from deck', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [],
          deck: [
            { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
            { cardId: 'piecie_affoe', type: 'PIECIE' },
            { cardId: 'piecie_quest_prep', type: 'PIECIE' },
          ],
        },
      },
    });

    const result = piecieEffects.effect_gun_een_piece(state, 'player_1');
    assertEqual(result.players.player_1.hand.length, 2);
    assertEqual(result.players.player_1.deck.length, 1);
  });

  test('Quest Prep sets +2 next quest roll bonus', () => {
    const state = createEngineState({
      players: {
        player_1: { questPrepBonus: 0 },
      },
    });

    const result = piecieEffects.effect_quest_prep(state, 'player_1');
    assertEqual(result.players.player_1.questPrepBonus, 2);
  });

  test('Slecht Gezet destroys active Place', () => {
    const state = createEngineState({
      activePlace: { cardId: 'place_the_gym', type: 'PLACE' },
    });

    const result = piecieEffects.effect_slecht_gezet(state);
    assertEqual(result.activePlace, null);
  });
}
