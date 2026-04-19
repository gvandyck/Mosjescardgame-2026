import { test, assertEqual, assertTrue } from '../helpers/testHelpers.js';
import { shuffleDeck, drawCards, discardCards, buildDeck } from '../../src/engine/deckEngine.js';
import { createInitialGameState, initializeGame } from '../../src/engine/gameState.js';
import { returnMosjeToHand, clearReturnedMosjesAtTurnEnd } from '../../src/engine/gameState.js';
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
import { QUESTS } from '../../src/data/quests.js';

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

  test('buildDeck blocks GENERAL quest cards from player deck', () => {
    const deck = buildDeck({
      piecies: [],
      snellePiecies: [],
      places: [],
      quests: [
        { id: 'quest_arm_wrestling', qty: 1 },
        { id: 'quest_personal_iron_will', qty: 1 },
      ],
    });
    const ids = deck.map(c => c.cardId);
    assertTrue(!ids.includes('quest_arm_wrestling'));
    assertTrue(ids.includes('quest_personal_iron_will'));
  });

  test('buildDeck logs warning when GENERAL quest is blocked', () => {
    const originalWarn = console.warn;
    let warningCount = 0;
    console.warn = (...args) => {
      if (String(args.join(' ')).includes('Blocked General Quest')) warningCount += 1;
    };

    buildDeck({
      piecies: [],
      snellePiecies: [],
      places: [],
      quests: [{ id: 'quest_arm_wrestling', qty: 1 }],
    });

    console.warn = originalWarn;
    assertEqual(warningCount, 1);
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

  test('initializeGame: sharedGeneralQuestDeck contains GENERAL quests only', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );
    const initialized = initializeGame(state, {
      player_1: STARTER_DECKS.find(d => d.id === 'DIGITAL_CONTROL'),
      player_2: STARTER_DECKS.find(d => d.id === 'PHYSICAL_FORCE'),
    });

    const generalIds = new Set(QUESTS.filter(q => q.questType === 'GENERAL').map(q => q.id));
    const allGeneral = initialized.sharedGeneralQuestDeck.every(q => generalIds.has(q.cardId));
    assertTrue(allGeneral);
  });

  test('initializeGame: player decks contain no GENERAL quest ids', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );
    const initialized = initializeGame(state, {
      player_1: STARTER_DECKS.find(d => d.id === 'DIGITAL_CONTROL'),
      player_2: STARTER_DECKS.find(d => d.id === 'PHYSICAL_FORCE'),
    });

    const generalIds = new Set(QUESTS.filter(q => q.questType === 'GENERAL').map(q => q.id));
    for (const player of Object.values(initialized.players)) {
      const allCards = [...player.hand, ...player.deck];
      const hasGeneralQuest = allCards.some(c => c.type === 'QUEST' && generalIds.has(c.cardId));
      assertTrue(!hasGeneralQuest);
    }
  });

  test('returnMosjeToHand moves active slot card to hand with saved state', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );

    const returned = returnMosjeToHand(state, 'player_1', 0);
    assertEqual(returned.players.player_1.activeSlots[0], null);
    const handMosje = returned.players.player_1.hand.find(c => c.type === 'MOSJE');
    assertTrue(!!handMosje);
    assertTrue(!!handMosje.savedState);
    assertTrue(handMosje.returnedThisTurn);
  });

  test('clearReturnedMosjesAtTurnEnd unlocks returned Mosje cards in hand', () => {
    const state = createInitialGameState(
      [
        { playerId: 'player_1', name: 'Test 1', deckId: 'DIGITAL_CONTROL' },
        { playerId: 'player_2', name: 'Test 2', deckId: 'PHYSICAL_FORCE' },
      ],
      'TEST'
    );

    const returned = returnMosjeToHand(state, 'player_1', 0);
    const cleared = clearReturnedMosjesAtTurnEnd(returned, 'player_1');
    const handMosje = cleared.players.player_1.hand.find(c => c.type === 'MOSJE');
    assertTrue(!!handMosje);
    assertTrue(!handMosje.returnedThisTurn);
    assertEqual(cleared.players.player_1.returnedMosjesThisTurn.length, 0);
  });
}
