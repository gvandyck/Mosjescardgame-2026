import { test, assertEqual, assertTrue, assertFalse, createEngineState } from '../helpers/testHelpers.js';
import {
  startTurn,
  phaseDrawCard,
  endTurn,
  attemptGeneralQuest,
  attemptPersonalQuest,
  playPiecie,
  playMosje,
  activatePiecie,
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

  test('startTurn resets per-turn action counters', () => {
    const state = createEngineState({
      players: {
        player_1: {
          drawsThisTurn: 3,
          pieciesActivatedThisTurn: 2,
          actionsThisTurn: 4,
          freePiecieActivationAvailable: true,
        },
      },
    });
    const result = startTurn(state);
    assertEqual(result.players.player_1.drawsThisTurn, 1);
    assertEqual(result.players.player_1.pieciesActivatedThisTurn, 0);
    assertEqual(result.players.player_1.actionsThisTurn.length, 0);
    assertEqual(result.players.player_1.freePiecieActivationAvailable, false);
  });

  test('phaseDrawCard increments drawsThisTurn', () => {
    const state = createEngineState();
    const result = phaseDrawCard(state, 'player_1');
    assertEqual(result.players.player_1.drawsThisTurn, 1);
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

  test('playPiecie places card face-down on field and does not discard immediately', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        },
      },
    });

    const out = playPiecie(
      state,
      'player_1',
      { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
      { id: 'piecie_kannetje_melk', name: 'Kannetje Melk', effectId: 'effect_kannetje_melk' }
    );

    assertTrue(out.success);
    assertEqual(out.state.players.player_1.hand.length, 0);
    assertEqual(out.state.players.player_1.discard.length, 0);
    const slot = out.state.players.player_1.piecieSlots.find(s => s !== null);
    assertTrue(!!slot);
    assertTrue(slot.faceDown === true);
    assertEqual(slot.canActivateOnTurn, out.state.turnNumber + 1);
    assertEqual(out.state.players.player_1.activeSlots[0].mp, state.players.player_1.activeSlots[0].mp);
  });

  test('playPiecie blocks the 5th placement in the same turn', () => {
    const state = createEngineState({
      players: {
        player_1: {
          pieciesPlayedThisTurn: 4,
          hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        },
      },
      activePlayerId: 'player_1',
    });

    const out = playPiecie(
      state,
      'player_1',
      { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
      { id: 'piecie_kannetje_melk', name: 'Kannetje Melk', effectId: 'effect_kannetje_melk' }
    );

    assertFalse(out.success);
    assertEqual(out.error, 'You can place up to 4 Piecies');
    assertEqual(out.state.players.player_1.hand.length, 1);
  });

  test('playMosje plays a Mosje from hand into an empty slot', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [{ cardId: 'mosje_coert_tech', type: 'MOSJE' }],
          activeSlots: [
            {
              cardId: 'mosje_west',
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
      activePlayerId: 'player_1',
    });

    const out = playMosje(state, 'player_1', { cardId: 'mosje_coert_tech', type: 'MOSJE' });
    assertTrue(out.success);
    assertEqual(out.state.players.player_1.hand.length, 0);
    assertEqual(out.state.players.player_1.activeSlots[1].cardId, 'mosje_coert_tech');
  });

  test('playMosje is blocked when both field slots are occupied', () => {
    const state = createEngineState({
      players: {
        player_1: {
          hand: [{ cardId: 'mosje_coert_tech', type: 'MOSJE' }],
          activeSlots: [
            {
              cardId: 'mosje_west',
              name: '[West] Sr.Tactical',
              traits: { mental: 3, technical: 1 },
              mp: 15,
              level: 1,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
            {
              cardId: 'mosje_coert_tech',
              name: '[Coert] The Hawaiian Tech Savant',
              traits: { technical: 3, mental: 2, social: 1 },
              mp: 10,
              level: 0,
              isDefeated: false,
              statusEffects: [],
              abilityUsedThisTurn: false,
            },
          ],
        },
      },
      activePlayerId: 'player_1',
    });

    const out = playMosje(state, 'player_1', { cardId: 'mosje_coert_tech', type: 'MOSJE' });
    assertFalse(out.success);
    assertEqual(out.error, 'You can have up to 2 Mosjes on the field');
    assertEqual(out.state.players.player_1.hand.length, 1);
  });

  test('playPiecie normalizes compressed piecieSlots from legacy state', () => {
    const state = createEngineState({
      players: {
        player_1: {
          piecieSlots: [
            {
              cardId: 'piecie_gun_een_piece',
              type: 'PIECIE',
              faceDown: true,
              activated: false,
              playedOnTurn: 1,
              canActivateOnTurn: 2,
            },
          ],
          hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        },
      },
      activePlayerId: 'player_1',
    });

    const out = playPiecie(
      state,
      'player_1',
      { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
      { id: 'piecie_kannetje_melk', name: 'Kannetje Melk', effectId: 'effect_kannetje_melk' }
    );

    assertTrue(out.success);
    assertEqual(out.state.players.player_1.piecieSlots.length, 4);
    assertTrue(out.state.players.player_1.piecieSlots[0] !== null);
    assertTrue(out.state.players.player_1.piecieSlots[1] !== null);
  });

  test('activatePiecie is blocked before the next turn', () => {
    const state = createEngineState({
      players: {
        player_1: {
          piecieSlots: [
            {
              cardId: 'piecie_kannetje_melk',
              type: 'PIECIE',
              faceDown: true,
              activated: false,
              playedOnTurn: 1,
              canActivateOnTurn: 2,
            },
            null,
            null,
            null,
            null,
          ],
        },
      },
      turnNumber: 1,
      activePlayerId: 'player_1',
    });

    const out = activatePiecie(state, 'player_1', 0);
    assertFalse(out.success);
    assertEqual(out.error, 'This Piecie can be activated starting next turn');
  });

  test('activatePiecie resolves effect and moves card to discard', () => {
    const state = createEngineState({
      players: {
        player_1: {
          piecieSlots: [
            {
              cardId: 'piecie_kannetje_melk',
              type: 'PIECIE',
              faceDown: true,
              activated: false,
              playedOnTurn: 1,
              canActivateOnTurn: 2,
            },
            null,
            null,
            null,
            null,
          ],
        },
      },
      turnNumber: 2,
      activePlayerId: 'player_1',
    });

    const out = activatePiecie(state, 'player_1', 0);
    assertTrue(out.success);
    assertEqual(out.state.players.player_1.piecieSlots[0], null);
    assertEqual(out.state.players.player_1.discard[0].cardId, 'piecie_kannetje_melk');
    assertEqual(out.state.players.player_1.pieciesActivatedThisTurn, 1);
  });
}
