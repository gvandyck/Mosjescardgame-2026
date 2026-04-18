import { test, assertEqual, assertTrue } from '../helpers/testHelpers.js';
import { shuffleDeck, drawCards, discardCards } from '../../src/engine/deckEngine.js';

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
}
