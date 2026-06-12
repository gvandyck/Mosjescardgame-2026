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
              cardId: 'mosje_martin_senor_west',
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
              cardId: 'mosje_martin_senor_west',
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
      _pendingTargets: { west_guess: 'PIECIE', west_top_card_type: 'PIECIE' },
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
              cardId: 'mosje_martin_senor_west',
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
      _pendingTargets: { west_guess: 'MOSJE', west_top_card_type: 'PIECIE' },
    });

    const result = mosjeAbilities.ability_martin_senor_west_calculated_guess(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 10, 'Should lose 10 MP on wrong guess');
    assertEqual(result.players.player_1.hand.length, 0, 'Should not draw cards on wrong guess');
  });

  // ── Jeffrey Brute Force (fixed) ──────────────────────────────────────────
  test('Jeffrey Brute Force: adds +10 questBonusMP and sets jeffreyFoodRestrictActive', () => {
    assertDefined(
      mosjeAbilities.ability_jeffrey_brute_force,
      'ability_jeffrey_brute_force missing'
    );
    const state = createEngineState();
    const result = mosjeAbilities.ability_jeffrey_brute_force(state, 'player_1');
    assertEqual(result.players.player_1.questBonusMP, 10, 'questBonusMP should be 10');
    assertTrue(result.players.player_1.jeffreyFoodRestrictActive, 'jeffreyFoodRestrictActive should be true');
  });

  test('Jeffrey Brute Force: does NOT drain opponent MP', () => {
    const state = createEngineState();
    const before = state.players.player_2.activeSlots[0].mp;
    const result = mosjeAbilities.ability_jeffrey_brute_force(state, 'player_1');
    assertEqual(result.players.player_2.activeSlots[0].mp, before, 'opponent MP should be unchanged');
  });

  test('Jeffrey Brute Force: stacks questBonusMP if called multiple times', () => {
    const state = createEngineState();
    const r1 = mosjeAbilities.ability_jeffrey_brute_force(state, 'player_1');
    const r2 = mosjeAbilities.ability_jeffrey_brute_force(r1, 'player_1');
    assertEqual(r2.players.player_1.questBonusMP, 20, 'questBonusMP should stack to 20');
  });

  // ── Tuk Architect (two-call pattern) ─────────────────────────────────────
  test('Tuk Architect call-1: sets _architectPeek, deck unchanged', () => {
    assertDefined(
      mosjeAbilities.ability_tuk_architect_perfect_placement,
      'ability_tuk_architect_perfect_placement missing'
    );
    const state = createEngineState({
      players: {
        player_1: {
          deck: [
            { cardId: 'card-a', type: 'PIECIE' },
            { cardId: 'card-b', type: 'PIECIE' },
            { cardId: 'card-c', type: 'PIECIE' },
            { cardId: 'card-d', type: 'PIECIE' },
          ],
        },
      },
    });
    const result = mosjeAbilities.ability_tuk_architect_perfect_placement(state, 'player_1');
    assertDefined(result._architectPeek, '_architectPeek should be set after call-1');
    assertEqual(result._architectPeek.cards.length, 3, 'should peek 3 cards');
    assertEqual(result.players.player_1.deck.length, 4, 'deck length should be unchanged');
  });

  test('Tuk Architect call-2: reorders top 3 to match orderedCardIds', () => {
    const state = createEngineState({
      players: {
        player_1: {
          deck: [
            { cardId: 'card-a', type: 'PIECIE' },
            { cardId: 'card-b', type: 'PIECIE' },
            { cardId: 'card-c', type: 'PIECIE' },
            { cardId: 'card-d', type: 'PIECIE' },
          ],
        },
      },
    });
    const result = mosjeAbilities.ability_tuk_architect_perfect_placement(
      state, 'player_1', ['card-c', 'card-a', 'card-b']
    );
    assertEqual(result.players.player_1.deck[0].cardId, 'card-c', 'deck[0] should be card-c');
    assertEqual(result.players.player_1.deck[1].cardId, 'card-a', 'deck[1] should be card-a');
    assertEqual(result.players.player_1.deck[2].cardId, 'card-b', 'deck[2] should be card-b');
    assertEqual(result.players.player_1.deck[3].cardId, 'card-d', 'card-d should remain at position 3');
  });

  // ── Ronald Mastermind (masterPlanChosenIndex) ─────────────────────────────
  test('Ronald Mastermind call-1: peeks top 3 without changing deck', () => {
    assertDefined(
      mosjeAbilities.ability_ronald_mastermind_master_plan,
      'ability_ronald_mastermind_master_plan missing'
    );
    const state = createEngineState({
      sharedGeneralQuestDeck: [
        { cardId: 'quest-a', type: 'QUEST' },
        { cardId: 'quest-b', type: 'QUEST' },
        { cardId: 'quest-c', type: 'QUEST' },
      ],
    });
    const result = mosjeAbilities.ability_ronald_mastermind_master_plan(state, 'player_1');
    assertDefined(result._masterPlanPeek, '_masterPlanPeek should be set');
    assertEqual(result.sharedGeneralQuestDeck[0].cardId, 'quest-a', 'top card unchanged in call-1');
  });

  test('Ronald Mastermind call-2: rotates card at masterPlanChosenIndex=1 to top', () => {
    const state = createEngineState({
      sharedGeneralQuestDeck: [
        { cardId: 'quest-a', type: 'QUEST' },
        { cardId: 'quest-b', type: 'QUEST' },
        { cardId: 'quest-c', type: 'QUEST' },
      ],
      _pendingTargets: { masterPlanChosenIndex: 1 },
    });
    const result = mosjeAbilities.ability_ronald_mastermind_master_plan(state, 'player_1');
    assertEqual(result.sharedGeneralQuestDeck[0].cardId, 'quest-b', 'quest-b should be rotated to top');
  });

  test('Ronald Mastermind call-2: clears masterPlanChosenIndex after rotation', () => {
    const state = createEngineState({
      sharedGeneralQuestDeck: [
        { cardId: 'quest-a', type: 'QUEST' },
        { cardId: 'quest-b', type: 'QUEST' },
        { cardId: 'quest-c', type: 'QUEST' },
      ],
      _pendingTargets: { masterPlanChosenIndex: 0 },
    });
    const result = mosjeAbilities.ability_ronald_mastermind_master_plan(state, 'player_1');
    assertEqual(
      result._pendingTargets?.masterPlanChosenIndex,
      undefined,
      'masterPlanChosenIndex should be cleared after use'
    );
  });

  // ── Ronald Chef (peek metadata) ───────────────────────────────────────────
  test('Ronald Chef: sets _ronaldPeekPlayerId and _ronaldPeekTimestamp', () => {
    assertDefined(
      mosjeAbilities.ability_ronald_chef_strategic_insight,
      'ability_ronald_chef_strategic_insight missing'
    );
    const state = createEngineState({
      players: {
        player_2: {
          deck: [
            { cardId: 'piecie-x', type: 'PIECIE' },
            { cardId: 'piecie-y', type: 'PIECIE' },
          ],
        },
      },
    });
    const result = mosjeAbilities.ability_ronald_chef_strategic_insight(state, 'player_1');
    assertEqual(result._ronaldPeekPlayerId, 'player_1', '_ronaldPeekPlayerId should be player_1');
    assertDefined(result._ronaldPeekTimestamp, '_ronaldPeekTimestamp should be set');
    assertTrue(result._ronaldPeekTimestamp > 0, '_ronaldPeekTimestamp should be a positive number');
  });

  test('West Calculated Guess: no effect when pending targets absent', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
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
    assertEqual(result.players.player_1.activeSlots[0].mp, 20, 'MP unchanged without pending targets');
    assertEqual(result.players.player_1.hand.length, 0, 'No cards drawn without pending targets');
  });
}
