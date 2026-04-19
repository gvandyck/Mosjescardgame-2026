import {
  test,
  assertTrue,
  assertFalse,
  assertEqual,
  assertDefined,
  createEngineState,
} from '../helpers/testHelpers.js';
import * as questLogic from '../../src/abilities/questLogic.js';
import { QUESTS } from '../../src/data/quests.js';
import { loseMP } from '../../src/engine/mpManager.js';

export function runQuestLogicTests() {
  console.log('[TEST] Running questLogic tests...');

  test('Quest Logic module exports canAttemptPersonalQuest', () => {
    assertDefined(
      questLogic.canAttemptPersonalQuest,
      'canAttemptPersonalQuest is missing in src/abilities/questLogic.js'
    );
  });

  test('Personal Quest allowed when required Mosje is on field', () => {
    assertDefined(questLogic.canAttemptPersonalQuest, 'canAttemptPersonalQuest is missing');
    const state = createEngineState();
    const quest = {
      id: 'quest_west_perfect_read',
      questType: 'PERSONAL',
      requiredMosjeId: 'mosje_west',
    };
    const result = questLogic.canAttemptPersonalQuest(quest, state, 'player_1');
    assertTrue(result);
  });

  test('Personal Quest blocked when required Mosje is not on field', () => {
    assertDefined(questLogic.canAttemptPersonalQuest, 'canAttemptPersonalQuest is missing');
    const state = createEngineState();
    const quest = {
      id: 'quest_binti_sharp_words',
      questType: 'PERSONAL',
      requiredMosjeId: 'mosje_binti',
    };
    const result = questLogic.canAttemptPersonalQuest(quest, state, 'player_1');
    assertFalse(result);
  });

  test('Personal Quest blocked when required Mosje is defeated', () => {
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
              isDefeated: true,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const quest = {
      id: 'quest_west_perfect_read',
      questType: 'PERSONAL',
      requiredMosjeId: 'mosje_west',
    };

    const result = questLogic.canAttemptPersonalQuest(quest, state, 'player_1');
    assertFalse(result);
  });

  test('General Quest allowed with non-negative active MP', () => {
    const state = createEngineState();
    const quest = QUESTS.find(q => q.id === 'quest_arm_wrestling');
    const result = questLogic.canAttemptGeneralQuest(quest, state, 'player_1');
    assertTrue(result);
  });

  test('General Quest blocked with negative active MP', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: -5,
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
    const quest = QUESTS.find(q => q.id === 'quest_arm_wrestling');
    const result = questLogic.canAttemptGeneralQuest(quest, state, 'player_1');
    assertFalse(result);
  });

  test('Data: existing starter quests are marked GENERAL', () => {
    const general = QUESTS.filter(q => q.questType === 'GENERAL');
    assertEqual(general.length >= 4, true);
  });

  test('resolveQuest success adds MP and increments quest counters', () => {
    const state = createEngineState();
    const quest = QUESTS.find(q => q.id === 'quest_leap_of_faith');
    const result = questLogic.resolveQuest(state, 'player_1', quest, true);
    assertEqual(result.players.player_1.activeSlots[0].mp, 75); // 15 + 60
    assertEqual(result.players.player_1.questsCompleted, 1);
    assertEqual(result.players.player_1.questsCompletedThisTurn, 1);
  });

  test('resolveQuest failure applies fail MP result', () => {
    const state = createEngineState();
    const quest = QUESTS.find(q => q.id === 'quest_leap_of_faith');
    const result = questLogic.resolveQuest(state, 'player_1', quest, false);
    assertEqual(result.players.player_1.activeSlots[0].mp, -5); // 15 + (-20)
    assertEqual(result.players.player_1.questsCompleted, 0);
  });

  test('quest_req_iron_will fails if Jeffrey is not on field', () => {
    const state = createEngineState();
    const out = questLogic.quest_req_iron_will(state, 'player_1');
    assertFalse(out.canAttempt);
  });

  test('quest_req_iron_will fails if totalDamageTaken < 40', () => {
    const state = createEngineState({
      players: {
        player_1: {
          totalDamageTaken: 20,
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3 },
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
    const out = questLogic.quest_req_iron_will(state, 'player_1');
    assertFalse(out.canAttempt);
  });

  test('quest_req_iron_will can attempt if Jeffrey active and damage >= 40', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.9; // roll 6
    const state = createEngineState({
      players: {
        player_1: {
          totalDamageTaken: 50,
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3 },
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
    const out = questLogic.quest_req_iron_will(state, 'player_1');
    Math.random = originalRandom;
    assertTrue(out.canAttempt);
    assertTrue(out.success);
  });

  test('loseMP tracks totalDamageTaken for Iron Will', () => {
    const state = createEngineState({
      players: {
        player_1: {
          totalDamageTaken: 0,
        },
      },
    });
    const result = loseMP(state, 'player_1', 0, 25);
    assertEqual(result.players.player_1.totalDamageTaken, 25);
  });

  test('quest_req_perfect_sync fails if only West is active', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { technical: 2 },
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
    const out = questLogic.quest_req_perfect_sync(state, 'player_1');
    assertFalse(out.canAttempt);
  });

  test('quest_req_perfect_sync auto-succeeds when West and Coert are active', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { technical: 2 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { technical: 3 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });
    const out = questLogic.quest_req_perfect_sync(state, 'player_1');
    assertTrue(out.canAttempt);
    assertTrue(out.success);
    assertEqual(out.diceRoll, null);
  });

  test('Perfect Sync success sets revealOpponentHand on activeQuest', () => {
    const state = createEngineState({
      activeQuest: { questName: 'Perfect Sync' },
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { technical: 2 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Tech Savant',
              traits: { technical: 3 },
              mp: 20,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
    });
    const quest = QUESTS.find(q => q.id === 'quest_personal_perfect_sync');
    const result = questLogic.resolveQuest(state, 'player_1', quest, true);
    assertTrue(!!result.activeQuest?.revealOpponentHand);
  });

  test('quest_req_lucky_crescendo fails if DJ is not active', () => {
    const state = createEngineState({ activePlace: 'place_skiffa' });
    const out = questLogic.quest_req_lucky_crescendo(state, 'player_1');
    assertFalse(out.canAttempt);
  });

  test('quest_req_lucky_crescendo fails if active Place is not Skiffa', () => {
    const state = createEngineState({
      activePlace: 'place_the_gym',
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_dj_8020',
              name: '[DJ 80/20] The Lucky Mixer',
              traits: { creative: 2 },
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
    const out = questLogic.quest_req_lucky_crescendo(state, 'player_1');
    assertFalse(out.canAttempt);
  });

  test('quest_req_lucky_crescendo allows reroll and succeeds on 5+', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.8; // roll 5
    const state = createEngineState({
      activePlace: 'place_skiffa',
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_dj_8020',
              name: '[DJ 80/20] The Lucky Mixer',
              traits: { creative: 2 },
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
    const out = questLogic.quest_req_lucky_crescendo(state, 'player_1');
    Math.random = originalRandom;
    assertTrue(out.canAttempt);
    assertTrue(out.allowReroll);
    assertTrue(out.success);
  });

  test('Lucky Crescendo success causes all opponents to lose 20 MP', () => {
    const state = createEngineState({
      activeQuest: { questName: 'Lucky Crescendo' },
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_dj_8020',
              name: '[DJ 80/20] The Lucky Mixer',
              traits: { creative: 2 },
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
              traits: { physical: 3 },
              mp: 40,
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
    const quest = QUESTS.find(q => q.id === 'quest_personal_lucky_crescendo');
    const result = questLogic.resolveQuest(state, 'player_1', quest, true);
    assertEqual(result.players.player_2.activeSlots[0].mp, 20);
  });

  test('The Void blocks base quest MP gain/loss on resolve', () => {
    const state = createEngineState({ activePlace: 'place_the_void' });
    const quest = QUESTS.find(q => q.id === 'quest_leap_of_faith');
    const successResult = questLogic.resolveQuest(state, 'player_1', quest, true);
    assertEqual(successResult.players.player_1.activeSlots[0].mp, 15);
  });
}
