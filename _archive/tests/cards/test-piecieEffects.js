import { test, assertDefined, assertEqual, createEngineState } from '../helpers/testHelpers.js';
import * as piecieEffects from '../../src/abilities/piecieEffects.js';

export function runPiecieEffectsTests() {
  console.log('[TEST] Running piecieEffects tests...');

  test('Piecie effects module exists', () => {
    assertDefined(piecieEffects, 'piecieEffects module failed to load');
  });

  test('Kannetje Melk grants +25 MP to active Mosje', () => {
    assertDefined(
      piecieEffects.effect_kannetje_melk,
      'effect_kannetje_melk missing'
    );
    const state = createEngineState();
    const result = piecieEffects.effect_kannetje_melk(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 40);
  });

  test('Kannetje Melk applies to selected own Mosje when target is provided', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_gandoe',
              name: '[Gandoe] Prime',
              traits: { technical: 2 },
              mp: 22,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
      _pendingTargets: { own_slot_index: 1 },
    });

    const result = piecieEffects.effect_kannetje_melk(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
    assertEqual(result.players.player_1.activeSlots[1].mp, 47);
  });

  test('Affoe applies opponent -15 MP and self +10 MP', () => {
    assertDefined(
      piecieEffects.effect_affoe,
      'effect_affoe missing'
    );
    const state = createEngineState();
    const result = piecieEffects.effect_affoe(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 25);
    assertEqual(result.players.player_2.activeSlots[0].mp, 5);
  });

  test('Affoe drains selected opponent Mosje and boosts selected own Mosje when targets are provided', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_gandoe',
              name: '[Gandoe] Prime',
              traits: { technical: 2 },
              mp: 22,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
        player_2: {
          activeSlots: [
            {
              cardId: 'mosje_jeffrey',
              name: '[Jeffrey] The Strongman',
              traits: { physical: 3, resilient: 1 },
              mp: 30,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Lt.',
              traits: { mental: 2 },
              mp: 25,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
      _pendingTargets: { affoe_drain: 'player_2_slot_1', affoe_gain: 'player_1_slot_1' },
    });

    const result = piecieEffects.effect_affoe(state, 'player_1');
    // Slot 0 of each player should be untouched
    assertEqual(result.players.player_2.activeSlots[0].mp, 30);
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
    // Slot 1 of opponent drained, slot 1 of self boosted
    assertEqual(result.players.player_2.activeSlots[1].mp, 10);
    assertEqual(result.players.player_1.activeSlots[1].mp, 32);
  });

  test('Broodje Doner gives +35 MP when level is 1+', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
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

    const result = piecieEffects.effect_broodje_doner(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 50);
  });

  test('Broodje Doner does nothing when level is below 1', () => {
    const state = createEngineState({
      players: {
        player_1: {
          activeSlots: [
            {
              cardId: 'mosje_martin_senor_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 0,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            null,
          ],
        },
      },
    });

    const result = piecieEffects.effect_broodje_doner(state, 'player_1');
    assertEqual(result.players.player_1.activeSlots[0].mp, 15);
  });

  test('Gun een Piece draws 2 cards from deck', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [],
          deck: [
            { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
            { cardId: 'piecie_affoe', type: 'PIECIE' },
            { cardId: 'piecie_quest_prep', type: 'PIECIE' },
          ],
        },
      },
    });

    const result = piecieEffects.effect_gun_een_piece(state, 'player_1');
    assertEqual(result.players.player_1.hand.length, 2);
    assertEqual(result.players.player_1.deck.length, 1);
  });

  test('Dubbele Dosis sets +2 next quest roll bonus', () => {
    const state = createEngineState({
      players: {
        player_1: { questPrepBonus: 0 },
      },
    });

    const result = piecieEffects.effect_quest_prep(state, 'player_1');
    assertEqual(result.players.player_1.questPrepBonus, 2);
  });

  test('Slecht Gezet destroys active Place', () => {
    const state = createEngineState({
      activePlace: { cardId: 'place_the_gym', type: 'PLACE' },
    });

    const result = piecieEffects.effect_slecht_gezet(state);
    assertEqual(result.activePlace, null);
  });

  // ── Zie Je Die Dingetjes (two-call pattern) ──────────────────────────────────
  test('Zie Je Die Dingetjes call-1: sets _dingetjesPeek, deck unchanged', () => {
    assertDefined(
      piecieEffects.effect_zie_je_die_dingetjes,
      'effect_zie_je_die_dingetjes missing'
    );
    const state = createEngineState({
      players: {
        player_1: {
          deck: [
            { cardId: 'card-a', type: 'PIECIE' },
            { cardId: 'card-b', type: 'PIECIE' },
            { cardId: 'card-c', type: 'PIECIE' },
            { cardId: 'card-d', type: 'PIECIE' },
            { cardId: 'card-e', type: 'PIECIE' },
          ],
        },
      },
    });
    const result = piecieEffects.effect_zie_je_die_dingetjes(state, 'player_1');
    assertDefined(result._dingetjesPeek, '_dingetjesPeek should be set after call-1');
    assertEqual(result._dingetjesPeek.cards.length, 3, 'should peek 3 cards');
    assertEqual(result._dingetjesPeek.cards[0], 'card-a', 'first peeked card should be card-a');
    assertEqual(result.players.player_1.deck.length, 5, 'deck length should be unchanged');
  });

  test('Zie Je Die Dingetjes call-2: chosen card in hand, other 2 at deck top, peek cleared', () => {
    const state = createEngineState({
      players: {
        player_1: {
          deck: [
            { cardId: 'card-a', type: 'PIECIE' },
            { cardId: 'card-b', type: 'PIECIE' },
            { cardId: 'card-c', type: 'PIECIE' },
            { cardId: 'card-d', type: 'PIECIE' },
          ],
          hand: [],
        },
      },
      _dingetjesPeek: { playerId: 'player_1', cards: ['card-a', 'card-b', 'card-c'] },
    });
    const result = piecieEffects.effect_zie_je_die_dingetjes(state, 'player_1', 'card-b');
    assertEqual(result.players.player_1.hand.length, 1, 'chosen card should be in hand');
    assertEqual(result.players.player_1.hand[0].cardId, 'card-b', 'card-b should be in hand');
    assertEqual(result.players.player_1.deck[0].cardId !== 'card-b', true, 'card-b not at deck top');
    assertEqual(result.players.player_1.deck.length, 3, 'deck should have 3 cards (2 put back + card-d)');
    assertEqual(result._dingetjesPeek, undefined, '_dingetjesPeek should be cleared');
  });

  test('Zie Je Die Dingetjes call-2 with orderedRemainder: deck positions match requested order', () => {
    const state = createEngineState({
      players: {
        player_1: {
          deck: [
            { cardId: 'card-a', type: 'PIECIE' },
            { cardId: 'card-b', type: 'PIECIE' },
            { cardId: 'card-c', type: 'PIECIE' },
            { cardId: 'card-d', type: 'PIECIE' },
          ],
          hand: [],
        },
      },
    });
    const result = piecieEffects.effect_zie_je_die_dingetjes(state, 'player_1', 'card-a', ['card-c', 'card-b']);
    assertEqual(result.players.player_1.hand[0].cardId, 'card-a', 'card-a should be in hand');
    assertEqual(result.players.player_1.deck[0].cardId, 'card-c', 'deck[0] should be card-c per orderedRemainder');
    assertEqual(result.players.player_1.deck[1].cardId, 'card-b', 'deck[1] should be card-b per orderedRemainder');
    assertEqual(result.players.player_1.deck[2].cardId, 'card-d', 'card-d should remain at position 2');
  });
}
