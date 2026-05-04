import { test, assertEqual, assertTrue, assertFalse, assertDefined, createEngineState } from '../helpers/testHelpers.js';
import { buildActiveQuestViewModel, renderBoard } from '../../src/ui/boardRenderer.js';

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

  test('renderBoard shows opponent face-down Piecie as hidden slot', () => {
    const container = document.createElement('div');
    const viewModel = {
      myPlayerId: 'player_1',
      activePlayerId: 'player_1',
      currentPhase: 'MAIN',
      players: {
        top: {
          name: 'Opponent',
          mosjes: [],
          piecies: [{ cardId: 'piecie_kannetje_melk', faceDown: true }],
        },
        bottom: {
          name: 'You',
          mosjes: [],
          piecies: [],
        },
      },
      activeQuest: null,
      gameState: createEngineState(),
    };

    renderBoard(container, viewModel, null, null, null);
    const hiddenSlot = container.querySelector('#piecies-opponent .piecie-slot.face-down-piecie.has-card');
    assertTrue(!!hiddenSlot, 'Expected hidden face-down piecie slot for opponent');
  });

  test('renderBoard shows Activate button for own activatable Piecie', () => {
    const container = document.createElement('div');
    const viewModel = {
      myPlayerId: 'player_1',
      activePlayerId: 'player_1',
      currentPhase: 'MAIN',
      players: {
        top: {
          name: 'Opponent',
          mosjes: [],
          piecies: [],
        },
        bottom: {
          name: 'You',
          mosjes: [],
          piecies: [
            {
              cardId: 'piecie_kannetje_melk',
              name: 'Kannetje Melk',
              type: 'PIECIE',
              description: 'Restore effect',
              faceDown: false,
              canActivate: true,
              slotIndex: 0,
            },
          ],
        },
      },
      activeQuest: null,
      gameState: createEngineState(),
    };

    let activatedSlot = null;
    renderBoard(container, viewModel, null, null, (slotIndex) => {
      activatedSlot = slotIndex;
    });

    const activateBtn = container.querySelector('#piecies-player .hand-card__play-btn');
    assertTrue(!!activateBtn, 'Expected Activate button on own activatable piecie');
    assertEqual(activateBtn.textContent, 'Activate');

    activateBtn.click();
    assertEqual(activatedSlot, 0, 'Activate callback should receive piecie slot index');
  });

  test('renderBoard shows Activate button for own activatable Personal Quest', () => {
    const container = document.createElement('div');
    const viewModel = {
      myPlayerId: 'player_1',
      activePlayerId: 'player_1',
      currentPhase: 'MAIN',
      players: {
        top: {
          name: 'Opponent',
          mosjes: [],
          piecies: [],
        },
        bottom: {
          name: 'You',
          mosjes: [],
          piecies: [
            {
              cardId: 'quest_personal_perfect_sync',
              name: 'Perfect Sync',
              type: 'QUEST',
              description: 'Personal quest',
              faceDown: false,
              canActivate: true,
              slotIndex: 2,
            },
          ],
        },
      },
      activeQuest: null,
      gameState: createEngineState(),
    };

    let activatedSlot = null;
    renderBoard(container, viewModel, null, null, (slotIndex) => {
      activatedSlot = slotIndex;
    });

    const activateBtn = container.querySelector('#piecies-player .hand-card__play-btn');
    assertTrue(!!activateBtn, 'Expected Activate button on own activatable personal quest');
    assertEqual(activateBtn.textContent, 'Activate');

    activateBtn.click();
    assertEqual(activatedSlot, 2, 'Activate callback should receive quest slot index');
  });
}
