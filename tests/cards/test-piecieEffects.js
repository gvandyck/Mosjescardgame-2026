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

  test('Kannetje Melk applies to selected own Mosje when target is provided', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
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
      _pendingTargets: { own_slot_index: 1 },
    });

    const result = piecieEffects.effect_kannetje_melk(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
    assertEqual(result.players.player_1.activeSlots[1].mp, 47);
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

  test('Affoe drains selected opponent Mosje and boosts selected own Mosje when targets are provided', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
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
        player_2: {
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3, resilient: 1 },
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Lt.',
              traits: { mental: 2 },
              mp: 25,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
      _pendingTargets: { affoe_drain: 'player_2_slot_1', affoe_gain: 'player_1_slot_1' },
    });

    const result = piecieEffects.effect_affoe(state, 'player_1');
    // Slot 0 of each player should be untouched
    assertEqual(result.players.player_2.activeSlots[0].mp, 30);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
    // Slot 1 of opponent drained, slot 1 of self boosted
    assertEqual(result.players.player_2.activeSlots[1].mp, 10);
    assertEqual(result.players.player_1.activeSlots[1].mp, 32);
  });

  test('Broodje Doner gives +35 MP when level is 1+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
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
              cardId: 'mosje_martin_senor_west',
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

  test('Dubbele Dosis sets +2 next quest roll bonus', () => {
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
