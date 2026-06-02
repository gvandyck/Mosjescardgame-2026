import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as placeEffects from '../../src/abilities/placeEffects.js';
import { setActivePlace, destroyActivePlace } from '../../src/engine/gameState.js';

export function runPlaceEffectsTests() {
  console.log('[TEST] Running placeEffects tests...');

  test('Place effects module exists', () => {
    assertDefined(placeEffects, 'placeEffects module failed to load');
  });

  // ─── The Gym ────────────────────────────────────────────────────────────────
  test('The Gym: Physical 3 gains +35 MP', () => {
    assertDefined(placeEffects.effect_the_gym, 'effect_the_gym missing');

    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3, resilient: 1 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3, technical: 1 }, mp: 15, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_the_gym(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 55); // physical 3 → +35
    assertEqual(result.players.player_2.activeSlots[0].mp, 5);  // non-physical → -10
  });

  test('The Gym: Physical 2 gains +25 MP (not FIGHTING type check)', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { physical: 2, technical: 1 }, mp: 10, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [null, null],
        },
      },
    });

    const result = placeEffects.effect_the_gym(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // physical 2 → +25
  });

  // ─── Quest Haven ────────────────────────────────────────────────────────────
  test('Quest Haven grants +10 on quest success', () => {
    assertDefined(placeEffects.effect_quest_haven, 'effect_quest_haven missing');

    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3, technical: 1 }, mp: 15, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_quest_haven(state, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 25);
  });

  test('Quest Haven grants +25 when two quests completed in turn', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3, technical: 1 }, mp: 15, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_quest_haven(state, true, 2);
    assertEqual(result.players.player_1.activeSlots[0].mp, 50); // +10 + +25
  });

  test('Quest Haven does not change MP on quest failure', () => {
    const state = createEngineState();
    const result = placeEffects.effect_quest_haven(state, false);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  // ─── Bank Chilling ──────────────────────────────────────────────────────────
  test('Bank Chilling: Social 2+ gains +15 MP at turn start', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { social: 2, technical: 1 }, mp: 15, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_bank_chilling(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30);
  });

  test('Bank Chilling: no bonus when social below 2', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { social: 1, mental: 3 }, mp: 15, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_bank_chilling(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Bank Chilling: no bonus when no social trait', () => {
    const state = createEngineState();
    const result = placeEffects.effect_bank_chilling(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  // ─── Skiffa ─────────────────────────────────────────────────────────────────
  test('Skiffa: non-SUBSTANCE Mosje loses 15 MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 40, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [null, null],
        },
      },
    });

    const result = placeEffects.effect_skiffa(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 25); // 40 - 15
  });

  test('Skiffa: SUBSTANCE Mosje is immune (no MP loss)', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_substance', name: 'Substance Mosje', traits: { substance: 1, physical: 2 }, mp: 40, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [null, null],
        },
      },
    });

    const result = placeEffects.effect_skiffa(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 40); // immune
  });

  // ─── Obby #1 ────────────────────────────────────────────────────────────────
  test('Obby #1: Physical 2+ gains +20 MP on success', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_obby_1(state, null, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 50); // 30 + 20
  });

  test('Obby #1: Resilient 2+ gains +20 MP on success', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { resilient: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_obby_1(state, null, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 50); // 30 + 20
  });

  test('Obby #1: Physical 2+ loses -10 MP on failure', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_obby_1(state, null, false);
    assertEqual(result.players.player_1.activeSlots[0].mp, 20); // 30 - 10
  });

  test('Obby #1: non-Physical/Resilient Mosje gets no bonus', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3, technical: 2 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_obby_1(state, null, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 30); // no change
  });

  // ─── Arcade ─────────────────────────────────────────────────────────────────
  test('Arcade: Technical 2+ gains +15 MP on quest success', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { technical: 2, mental: 1 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_arcade(state, null, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // 20 + 15
  });

  test('Arcade: no bonus on quest failure', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { technical: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_arcade(state, null, false);
    assertEqual(result.players.player_1.activeSlots[0].mp, 20); // no change
  });

  test('Arcade: no bonus for non-Technical Mosje', () => {
    const state = createEngineState({
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3, resilient: 1 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_arcade(state, null, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 20); // no change
  });

  // ─── Coert's Caravan ────────────────────────────────────────────────────────
  test("Coert's Caravan: Coert Mosje gains +15 MP at turn start", () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'coert-kasteluck', name: 'Coert KasteLuck', traits: { creative: 2 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_coerts_caravan(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // 20 + 15
  });

  test("Coert's Caravan: non-Coert Mosje gets no bonus", () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: { activeSlots: [null, null] },
      },
    });
    const result = placeEffects.effect_coerts_caravan(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 20); // no change
  });

  // ─── Drain Zone ─────────────────────────────────────────────────────────────
  test('Drain Zone: Mosje with lowest MP loses another 10 MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_drain_zone(state);
    assertEqual(result.players.player_1.activeSlots[0].mp, 50); // not the lowest
    assertEqual(result.players.player_2.activeSlots[0].mp, 10); // 20 - 10 (lowest)
  });

  test('Drain Zone: only targets the single lowest MP Mosje', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 3 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });

    const result = placeEffects.effect_drain_zone(state);
    // Both have same MP — first one found should lose 10
    const p1mp = result.players.player_1.activeSlots[0].mp;
    const p2mp = result.players.player_2.activeSlots[0].mp;
    // One player lost 10, other stayed at 30
    assertEqual(p1mp + p2mp, 50); // total 50 (one lost 10)
  });

  // ─── setActivePlace / destroyActivePlace ────────────────────────────────────
  test('setActivePlace stores card id on state', () => {
    const state = createEngineState();
    const result = setActivePlace(state, 'place_the_gym', 'player_1');
    assertEqual(result.activePlace, 'place_the_gym');
    assertEqual(result.activePlacePlayedBy, 'player_1');
    assertEqual(result.activePlaceTurnsActive, 0);
  });

  test('setActivePlace moves old Place to owner discard', () => {
    let state = createEngineState({ activePlace: 'place_the_void', activePlacePlayedBy: 'player_1' });
    state = setActivePlace(state, 'place_arcade', 'player_1');
    assertEqual(state.activePlace, 'place_arcade');
    assertEqual(state.players.player_1.discard[0].cardId, 'place_the_void');
  });

  test('destroyActivePlace clears activePlace and pushes to owner discard', () => {
    let state = createEngineState({ activePlace: 'place_the_gym', activePlacePlayedBy: 'player_1' });
    state = destroyActivePlace(state);
    assertEqual(state.activePlace, null);
    assertEqual(state.players.player_1.discard[0].cardId, 'place_the_gym');
    assertEqual(state.activePlaceTurnsActive, 0);
  });

  test('destroyActivePlace is a no-op when no Place is active', () => {
    const state = createEngineState();
    const result = destroyActivePlace(state);
    assertEqual(result.activePlace, null);
    assertEqual(result.players.player_1.discard.length, 0);
  });

  // ─── resolvePlaceEffect dispatcher ──────────────────────────────────────────
  test('resolvePlaceEffect returns state unchanged when no activePlace', () => {
    const state = createEngineState();
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('resolvePlaceEffect ignores wrong trigger phase', () => {
    // place_the_gym trigger is END_PHASE — should not fire on ON_QUEST
    const state = createEngineState({ activePlace: 'place_the_gym' });
    const result = placeEffects.resolvePlaceEffect(state, 'ON_QUEST');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('resolvePlaceEffect routes END_PHASE to effect_the_void (all -15 MP)', () => {
    const state = createEngineState({
      activePlace: 'place_the_void',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 50, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
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
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2 }, mp: 40, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 30, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'ON_QUEST', { didSucceed: true });
    assertEqual(result.players.player_1.activeSlots[0].mp, 60); // 40 + 20 (physical 2+, success)
  });

  test('resolvePlaceEffect routes TURN_START to effect_bank_chilling', () => {
    const state = createEngineState({
      activePlace: 'place_bank_chilling',
      activePlayerId: 'player_1',
      players: {
        player_1: {
          activeSlots: [
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { social: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
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
    const result = placeEffects.resolvePlaceEffect(state, 'TURN_START', { playerId: 'player_1' });
    assertEqual(result.players.player_1.activeSlots[0].mp, 35); // 20 + 15 (social 3 >= 2)
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
            { cardId: 'mosje_martin_senor_west', name: '[West] Sr.Tactical', traits: { mental: 3 }, mp: 20, level: 1, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
        player_2: {
          activeSlots: [
            { cardId: 'mosje_jeffrey', name: '[Jeffrey] The Strongman', traits: { physical: 2, resilient: 1 }, mp: 10, level: 0, isDefeated: false, statusEffects: [], abilityUsedThisTurn: false },
            null,
          ],
        },
      },
    });
    const result = placeEffects.resolvePlaceEffect(state, 'END_PHASE');
    assertEqual(result.players.player_1.activeSlots[0].mp, 30); // no resilient → +10
    assertEqual(result.players.player_2.activeSlots[0].mp, 25); // resilient 1+ → +15
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
