import { test, assertEqual, assertTrue, createEngineState } from '../helpers/testHelpers.js';
import {
  startTurn,
  phaseDrawCard,
  endTurn,
  attemptGeneralQuest,
  attemptPersonalQuest,
} from '../../src/engine/turnManager.js';

export function runTurnManagerTests() {
  console.log('[TEST] Running turnManager tests...');

  test('phaseDrawCard draws 1 card by default', () => {
    const state = createEngineState();
    const handBefore = state.players.player_1.hand.length;
    const deckBefore = state.players.player_1.deck.length;
    const result = phaseDrawCard(state, 'player_1');
    assertEqual(result.players.player_1.hand.length, handBefore + 1);
    assertEqual(result.players.player_1.deck.length, deckBefore - 1);
  });

  test('startTurn resets quest-attempt tracker', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hasAttemptedQuestThisTurn: true,
        },
      },
    });
    const result = startTurn(state);
    assertEqual(result.players.player_1.hasAttemptedQuestThisTurn, false);
  });

  test('attemptGeneralQuest draws from sharedGeneralQuestDeck', () => {
    const state = createEngineState();
    const deckBefore = state.sharedGeneralQuestDeck.length;
    const out = attemptGeneralQuest(state);
    assertTrue(!!out.questCard);
    assertEqual(out.state.sharedGeneralQuestDeck.length, deckBefore - 1);
    assertEqual(out.state.players.player_1.hasAttemptedQuestThisTurn, true);
  });

  test('attemptPersonalQuest takes card from hand', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [
            { cardId: 'quest_west_perfect_read', type: 'QUEST', questType: 'PERSONAL' },
          ],
        },
      },
    });

    const out = attemptPersonalQuest(state, 'quest_west_perfect_read');
    assertTrue(!!out.questCard);
    assertEqual(out.state.players.player_1.hand.length, 0);
    assertEqual(out.state.players.player_1.hasAttemptedQuestThisTurn, true);
  });

  test('endTurn advances active player', () => {
    const state = createEngineState();
    const result = endTurn(state);
    assertEqual(result.activePlayerId, 'player_2');
  });
}
