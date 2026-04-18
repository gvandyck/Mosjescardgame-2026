import { test, assertEqual, assertTrue } from '../helpers/testHelpers.js';
import { shuffleDeck, drawCards, discardCards } from '../../src/engine/deckEngine.js';
import { createInitialGameState, initializeGame } from '../../src/engine/gameState.js';

export function runDeckEngineTests() {
  console.log('[TEST] Running deckEngine tests...');

  test('shuffleDeck returns same number of cards', () => {
    const deck = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = shuffleDeck(deck);
    assertEqual(shuffled.length, deck.length);
  });

  test('shuffleDeck keeps all original cards', () => {
    const deck = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = shuffleDeck(deck);
    assertTrue(deck.every(card => shuffled.includes(card)));
  });

  test('drawCards returns requested amount when available', () => {
    const deck = ['a', 'b', 'c'];
    const { drawn, remaining } = drawCards(deck, 2);
    assertEqual(drawn.length, 2);
    assertEqual(remaining.length, 1);
  });

  test('drawCards returns only available cards if deck is short', () => {
    const deck = ['a'];
    const { drawn, remaining } = drawCards(deck, 2);
    assertEqual(drawn.length, 1);
    assertEqual(remaining.length, 0);
  });

  test('discardCards prepends new cards to discard pile', () => {
    const discard = ['old_1', 'old_2'];
    const next = discardCards(discard, ['new_1']);
    assertEqual(next[0], 'new_1');
    assertEqual(next[1], 'old_1');
  });

  // ── initializeGame / starting hand ─────────────────────────
  test('initializeGame: each player has exactly 7 cards in hand after init', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );
    const verified = initializeGame(state);
    assertEqual(verified.players.player_1.hand.length, 7, 'player_1 should have 7 cards');
    assertEqual(verified.players.player_2.hand.length, 7, 'player_2 should have 7 cards');
  });

  test('initializeGame: deck has correct number of cards remaining after init', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );
    const p1 = state.players.player_1;
    const totalCards = p1.hand.length + p1.deck.length;
    assertEqual(p1.hand.length, 7, 'starting hand must be 7');
    assertTrue(p1.deck.length === totalCards - 7, 'remaining deck = total - 7');
  });

  test('initializeGame: no card instance appears in both hand and deck', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );
    const p1 = state.players.player_1;
    const overlap = p1.hand.filter(handCard => p1.deck.includes(handCard));
    assertEqual(overlap.length, 0, 'no card instance should be in both hand and deck');
  });
}
