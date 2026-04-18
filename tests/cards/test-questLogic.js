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
}
