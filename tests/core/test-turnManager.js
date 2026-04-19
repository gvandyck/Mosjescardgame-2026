import { test, assertEqual, assertTrue, assertFalse, createEngineState } from '../helpers/testHelpers.js';
import {
  startTurn,
  phaseDrawCard,
  endTurn,
  attemptGeneralQuest,
  attemptPersonalQuest,
  playSnellie,
  canPlayerActNow,
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

  // ── canPlayerActNow ─────────────────────────────────────────
  test('canPlayerActNow: Snelle Piecie allowed during opponent\'s turn', () => {
    const state = createEngineState({ activePlayerId: 'player_2' });
    assertTrue(canPlayerActNow(state, 'player_1', 'SNELLE_PIECIE'));
  });

  test('canPlayerActNow: regular Piecie blocked during opponent\'s turn', () => {
    const state = createEngineState({ activePlayerId: 'player_2' });
    assertFalse(canPlayerActNow(state, 'player_1', 'PIECIE'));
  });

  test('canPlayerActNow: regular Piecie allowed during own MAIN phase', () => {
    const state = createEngineState({ activePlayerId: 'player_1', currentPhase: 'MAIN' });
    assertTrue(canPlayerActNow(state, 'player_1', 'PIECIE'));
  });

  test('canPlayerActNow: Quest allowed during own MAIN phase', () => {
    const state = createEngineState({ activePlayerId: 'player_1', currentPhase: 'MAIN' });
    assertTrue(canPlayerActNow(state, 'player_1', 'QUEST'));
  });

  test('canPlayerActNow: Mosje blocked out of turn', () => {
    const state = createEngineState({ activePlayerId: 'player_2' });
    assertFalse(canPlayerActNow(state, 'player_1', 'MOSJE'));
  });

  test('canPlayerActNow: Place blocked out of turn', () => {
    const state = createEngineState({ activePlayerId: 'player_2' });
    assertFalse(canPlayerActNow(state, 'player_1', 'PLACE'));
  });

  test('playSnellie initializes missing discard array instead of crashing', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [{ cardId: 'snelle_jensen', type: 'SNELLE_PIECIE' }],
          discard: undefined,
        },
      },
    });

    const out = playSnellie(
      state,
      'player_1',
      { cardId: 'snelle_jensen', type: 'SNELLE_PIECIE' },
      { name: 'Jensen!', effectId: 'effect_snelle_jensen' }
    );

    assertTrue(out.success);
    assertEqual(out.state.players.player_1.discard.length, 1);
    assertEqual(out.state.players.player_1.hand.length, 0);
  });

  test('attemptGeneralQuest recycles shared discard when deck is empty', () => {
    const state = createEngineState({
      sharedGeneralQuestDeck: [],
      sharedGeneralQuestDiscard: [
        { cardId: 'quest_arm_wrestling', type: 'QUEST' },
        { cardId: 'quest_quick_thinking', type: 'QUEST' },
      ],
    });

    const out = attemptGeneralQuest(state);
    assertTrue(!!out.questCard);
    assertEqual(out.state.sharedGeneralQuestDiscard.length, 0);
    assertTrue(out.state.sharedGeneralQuestDeck.length >= 1);
  });

  test('canPlayerActNow keeps Snelle playable during opponent active quest', () => {
    const state = createEngineState({
      activePlayerId: 'player_2',
      activeQuest: { attacker: 'player_2' },
    });
    assertTrue(canPlayerActNow(state, 'player_1', 'SNELLE_PIECIE'));
    assertFalse(canPlayerActNow(state, 'player_1', 'PIECIE'));
  });
}
