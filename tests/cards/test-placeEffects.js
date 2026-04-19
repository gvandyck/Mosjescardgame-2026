import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as placeEffects from '../../src/abilities/placeEffects.js';
import { setActivePlace, destroyActivePlace } from '../../src/engine/gameState.js';

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

  // ─── setActivePlace / destroyActivePlace ────────────────────────────
  test('setActivePlace stores card id on state', () => {
    const state = createEngineState();
    const result = setActivePlace(state, 'place_the_gym', 'player_1');
    assertEqual(result.activePlace, 'place_the_gym');
    assertEqual(result.activePlacePlayedBy, 'player_1');
    assertEqual(result.activePlaceTurnsActive, 0);
  });

  test('setActivePlace moves old Place to sharedPlaceDiscard', () => {
    let state = createEngineState({ activePlace: 'place_the_void' });
    state = setActivePlace(state, 'place_arcade', 'player_1');
    assertEqual(state.activePlace, 'place_arcade');
    assertEqual(state.sharedPlaceDiscard[0].cardId, 'place_the_void');
  });

  test('destroyActivePlace clears activePlace and pushes to discard', () => {
    let state = createEngineState({ activePlace: 'place_the_gym' });
    state = destroyActivePlace(state);
    assertEqual(state.activePlace, null);
    assertEqual(state.sharedPlaceDiscard[0].cardId, 'place_the_gym');
    assertEqual(state.activePlaceTurnsActive, 0);
  });

  test('destroyActivePlace is a no-op when no Place is active', () => {
    const state = createEngineState();
    const result = destroyActivePlace(state);
    assertEqual(result.activePlace, null);
    assertEqual(result.sharedPlaceDiscard.length, 0);
  });

  // ─── resolvePlaceEffect dispatcher ──────────────────────────────────
  test('resolvePlaceEffect returns state unchanged when no activePlace', () => {
    const state = createEngineState();
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('resolvePlaceEffect ignores wrong trigger phase', () => {
    // place_the_gym trigger is END_PHASE — should not fire on ON_QUEST
    const state = createEngineState({ activePlace: 'place_the_gym' });
    const result = placeEffects.resolvePlaceEffect(state, 'ON_QUEST');
    // The Gym effect would have changed MP — if it didn't fire, MP stays at 15
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('resolvePlaceEffect routes END_PHASE to effect_the_void', () => {
    const state = createEngineState({
      activePlace: 'place_the_void',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3 }, mp: 40, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // 50 - 15
    assertEqual(result.players.player_2.activeSlots[0].mp, 25); // 40 - 15
  });

  test('resolvePlaceEffect routes ON_QUEST to effect_obby_1', () => {
    const state = createEngineState({
      activePlace: 'place_obby_1',
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_west', name: '[West] Sr.Tactical', traits: { physical: 3 }, mp: 40, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'ON_QUEST', { didSucceed: true });
    assertEqual(result.players.player_1.activeSlots[0].mp, 60); // 40 + 20 (physical >= 2, success)
  });

  test('resolvePlaceEffect routes ON_DRAW to effect_bank_chilling', () => {
    const state = createEngineState({
      activePlace: 'place_bank_chilling',
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'ON_DRAW', { playerId: 'player_1', cardsDrawn: 2 });
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // 20 + 15 (mental 3 >= 2, drew 2)
  });

  test('resolvePlaceEffect records last place effect metadata', () => {
    const state = createEngineState({ activePlace: 'place_the_void' });
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result._lastPlaceEffect.placeId, 'place_the_void');
    assertEqual(result._lastPlaceEffect.phase, 'END_PHASE');
  });

  test('resolvePlaceEffect routes END_PHASE to effect_zo_is_natuur', () => {
    const state = createEngineState({
      activePlace: 'place_zo_is_natuur',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 10, level: 0, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30); // level 1 → +10
    assertEqual(result.players.player_2.activeSlots[0].mp, 15); // level 0 → +5
  });

  test('triggerPlaceDestroyedEffects gives Alyssa Fissa +15 MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_alyssa_fissa',
              name: '[Alyssa Fissa] Party Power',
              traits: { social: 3 },
              mp: 30,
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

    const result = placeEffects.triggerPlaceDestroyedEffects(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 45);
  });
}
