import { test, assertDefined, assertEqual, assertTrue, createEngineState } from '../helpers/testHelpers.js';
import * as mosjeAbilities from '../../src/abilities/mosjeAbilities.js';

export function runMosjeAbilityTests() {
  console.log('[TEST] Running mosjeAbilities tests...');

  test('Mosje abilities module exists', () => {
    assertDefined(mosjeAbilities, 'mosjeAbilities module failed to load');
  });

  test('DJ 80/20 passive adds 10 MP to active Mosje', () => {
    assertDefined(
      mosjeAbilities.ability_dj_8020_lucky_beats,
      'ability_dj_8020_lucky_beats missing'
    );
    const state = createEngineState();
    const result = mosjeAbilities.ability_dj_8020_lucky_beats(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 25);
  });

  test('Binti ability discards one card and reduces opponent MP by 10', () => {
    assertDefined(
      mosjeAbilities.ability_binti_cutting_words,
      'ability_binti_cutting_words missing'
    );

    const state = createEngineState({
      players: {
        player_1: {
          hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        },
        player_2: {
          hand: [{ cardId: 'piecie_affoe', type: 'PIECIE' }],
          discard: [],
        },
      },
    });

    const result = mosjeAbilities.ability_binti_cutting_words(state, 'player_1', 'piecie_kannetje_melk');
    assertEqual(result.players.player_1.hand.length, 0);
    assertEqual(result.players.player_2.activeSlots[0].mp, 10);
    assertEqual(result.players.player_2.discard.length, 1);
  });

  test('Binti ability throws if no discard-cost card is available', () => {
    const state = createEngineState({
      players: {
        player_1: { hand: [] },
      },
    });

    let threw = false;
    try {
      mosjeAbilities.ability_binti_cutting_words(state, 'player_1', 'piecie_kannetje_melk');
    } catch {
      threw = true;
    }
    assertTrue(threw, 'Expected Binti ability to throw when cost card is missing');
  });

  test('Coert ability pays 10 MP and draws 1 card', () => {
    assertDefined(
      mosjeAbilities.ability_coert_extra_resources,
      'ability_coert_extra_resources missing'
    );

    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { mental: 2, technical: 3 },
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          hand: [],
          deck: [{ cardId: 'piecie_affoe', type: 'PIECIE' }],
        },
      },
    });

    const result = mosjeAbilities.ability_coert_extra_resources(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 20);
    assertEqual(result.players.player_1.hand.length, 1);
    assertEqual(result.players.player_1.deck.length, 0);
  });

  test('Coert ability throws below 10 MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { mental: 2, technical: 3 },
              mp: 5,
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

    let threw = false;
    try {
      mosjeAbilities.ability_coert_extra_resources(state, 'player_1');
    } catch {
      threw = true;
    }
    assertTrue(threw, 'Expected Coert ability to throw when MP is below 10');
  });

  test('Coert ability deducts MP from selected Coert slot', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 40,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { mental: 2, technical: 3 },
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
          hand: [],
          deck: [{ cardId: 'piecie_affoe', type: 'PIECIE' }],
        },
      },
    });

    const result = mosjeAbilities.ability_coert_extra_resources(state, 'player_1', 'mosje_coert_tech');
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
    assertEqual(result.players.player_1.activeSlots[1].mp, 20);
    assertEqual(result.players.player_1.hand.length, 1);
  });

  // ── West Calculated Guess ────────────────────────────────────────────────
  test('West Calculated Guess: correct type guess draws 2 cards and adds 10 MP', () => {
    assertDefined(
      mosjeAbilities.ability_martin_senor_west_calculated_guess,
      'ability_martin_senor_west_calculated_guess missing'
    );

    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          deck: [
            { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
            { cardId: 'piecie_affoe', type: 'PIECIE' },
          ],
          hand: [],
        },
      },
      _pendingTargets: { westSelectedType: 'PIECIE' },
    });

    const result = mosjeAbilities.ability_martin_senor_west_calculated_guess(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30, 'Should gain +10 MP on correct guess');
    assertEqual(result.players.player_1.hand.length, 2, 'Should draw 2 cards on correct guess');
  });

  test('West Calculated Guess: wrong type loses 10 MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          deck: [
            { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
          ],
          hand: [],
        },
      },
      _pendingTargets: { westSelectedType: 'MOSJE' },
    });

    const result = mosjeAbilities.ability_martin_senor_west_calculated_guess(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 10, 'Should lose 10 MP on wrong guess');
    assertEqual(result.players.player_1.hand.length, 0, 'Should not draw cards on wrong guess');
  });

  test('West Calculated Guess: sets _needsWestGuessModal when no type selected', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
          deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
          hand: [],
        },
      },
    });

    const result = mosjeAbilities.ability_martin_senor_west_calculated_guess(state, 'player_1');
    assertTrue(result._needsWestGuessModal, 'Should set _needsWestGuessModal when no type provided');
  });
}
