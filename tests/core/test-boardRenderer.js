import { test, assertEqual, assertTrue, assertFalse, assertDefined, createEngineState } from '../helpers/testHelpers.js';
import { buildActiveQuestViewModel } from '../../src/ui/boardRenderer.js';

export function runBoardRendererTests() {
  console.log('[TEST] Running boardRenderer tests...');

  // ─── buildActiveQuestViewModel ───────────────────────────────

  test('buildActiveQuestViewModel returns null when activeQuest is null', () => {
    const state = createEngineState();
    const result = buildActiveQuestViewModel(state, 'player_1');
    assertEqual(result, null);
  });

  test('buildActiveQuestViewModel returns null for null gameState', () => {
    const result = buildActiveQuestViewModel(null, 'player_1');
    assertEqual(result, null);
  });

  test('buildActiveQuestViewModel returns quest data when activeQuest is set', () => {
    const state = createEngineState();
    state.activeQuest = {
      questName: 'Arm Wrestling',
      questType: 'GENERAL',
      attacker: 'player_1',
      successMP: 40,
      failMP: -60,
      currentMp: 15,
    };
    const result = buildActiveQuestViewModel(state, 'player_1');
    assertDefined(result, 'result should not be null');
    assertEqual(result.questName, 'Arm Wrestling');
    assertEqual(result.questType, 'GENERAL');
    assertEqual(result.attacker, 'player_1');
    assertEqual(result.successMP, 40);
    assertEqual(result.failMP, -60);
    assertEqual(result.currentMp, 15);
  });

  test('buildActiveQuestViewModel falls back attacker to activePlayerId when not set', () => {
    const state = createEngineState();
    state.activePlayerId = 'player_2';
    state.activeQuest = {
      questName: 'Quick Thinking',
      questType: 'GENERAL',
      successMP: 50,
      failMP: -30,
    };
    // attacker is not set on the quest object
    const result = buildActiveQuestViewModel(state, 'player_1');
    assertEqual(result.attacker, 'player_2', 'attacker should fall back to activePlayerId');
  });

  test('buildActiveQuestViewModel preserves explicit attacker over activePlayerId', () => {
    const state = createEngineState();
    state.activePlayerId = 'player_2';
    state.activeQuest = {
      questName: 'Sprint Race',
      questType: 'GENERAL',
      attacker: 'player_1',
      successMP: 35,
      failMP: -15,
    };
    const result = buildActiveQuestViewModel(state, 'player_1');
    assertEqual(result.attacker, 'player_1', 'explicit attacker should be preserved');
  });

  test('buildActiveQuestViewModel does not mutate the original gameState', () => {
    const state = createEngineState();
    state.activeQuest = {
      questName: 'Arm Wrestling',
      questType: 'GENERAL',
      attacker: 'player_1',
      successMP: 40,
      failMP: -60,
    };
    const original = JSON.stringify(state.activeQuest);
    buildActiveQuestViewModel(state, 'player_1');
    assertEqual(JSON.stringify(state.activeQuest), original, 'activeQuest should not be mutated');
  });

  test('buildActiveQuestViewModel works for personal quest type', () => {
    const state = createEngineState();
    state.activeQuest = {
      questName: 'West Perfect Read',
      questType: 'PERSONAL',
      attacker: 'player_1',
      successMP: 30,
      failMP: -10,
      currentMp: 22,
    };
    const result = buildActiveQuestViewModel(state, 'player_1');
    assertEqual(result.questType, 'PERSONAL');
    assertEqual(result.currentMp, 22);
  });
}
