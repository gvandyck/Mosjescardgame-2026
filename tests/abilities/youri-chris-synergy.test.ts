import { describe, it, expect } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { ability_youri_speed_activate } from '../../src/abilities/mosjeAbilities.js';
// @ts-expect-error — JS module, no type declarations
import { playPiecie } from '../../src/engine/turnManager.js';
// @ts-expect-error — JS module, no type declarations
import { createEngineState } from '../helpers/testHelpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 27 — Youri ability + Chris+Youri passive synergy tests
// ─────────────────────────────────────────────────────────────────────────────

function buildYouriState(opts: {
  youriMP?: number;
  youriAbilityUses?: number;
  faceDownPiecies?: number;
} = {}) {
  const { youriMP = 50, youriAbilityUses = 0, faceDownPiecies = 0 } = opts;
  const state = createEngineState({
    players: {
      player_1: {
        playerId: 'player_1',
        name: 'Test',
        deckId: 'DIGITAL_CONTROL',
        hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        deck: [
          { cardId: 'piecie_boxing_gloves', type: 'PIECIE' },
          { cardId: 'piecie_varkenspootjes', type: 'PIECIE' },
        ],
        discard: [],
        graveyard: [],
        welloe: [],
        activeSlots: [
          {
            cardId: 'mosje_youri',
            name: '[Youri] The Speedrunner',
            traits: { technical: 3, mental: 2, resilient: 1 },
            mp: youriMP,
            level: 1,
            isDefeated: false,
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: Array.from({ length: 4 }, (_, i) =>
          i < faceDownPiecies
            ? { cardId: 'piecie_kannetje_melk', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 999 }
            : null
        ),
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        youriAbilityUses,
      },
      player_2: {
        playerId: 'player_2',
        name: 'Opp',
        deckId: 'PHYSICAL_FORCE',
        hand: [],
        deck: [],
        discard: [],
        graveyard: [],
        welloe: [],
        activeSlots: [null, null],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        youriAbilityUses: 0,
      },
    },
  });
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// ability_youri_speed_activate
// ─────────────────────────────────────────────────────────────────────────────
describe('ability_youri_speed_activate', () => {
  it('blocks when youriAbilityUses >= 3', () => {
    const state = buildYouriState({ youriAbilityUses: 3, faceDownPiecies: 1 });
    const result = ability_youri_speed_activate(state, 'player_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/3 times/i);
  });

  it('blocks when Youri slot has < 20 MP', () => {
    const state = buildYouriState({ youriMP: 10, faceDownPiecies: 1 });
    const result = ability_youri_speed_activate(state, 'player_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not enough mp/i);
  });

  it('blocks when no face-down piecies on field', () => {
    const state = buildYouriState({ faceDownPiecies: 0 });
    const result = ability_youri_speed_activate(state, 'player_1');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no face-down/i);
  });

  it('auto-activates single face-down piecie: sets canActivateOnTurn, draws 1 card, increments counter', () => {
    const state = buildYouriState({ youriMP: 50, faceDownPiecies: 1 });
    const before = state.players.player_1.deck.length;
    const result = ability_youri_speed_activate(state, 'player_1');
    expect(result.success).toBe(true);
    expect(result.pendingYouriActivation).toBeFalsy();
    const p = result.state.players.player_1;
    // MP deducted
    expect(p.activeSlots[0].mp).toBe(30);
    // use counter incremented
    expect(p.youriAbilityUses).toBe(1);
    // piecie unlocked
    expect(p.piecieSlots[0].canActivateOnTurn).toBe(result.state.turnNumber);
    // card drawn
    expect(p.hand.length).toBe(2); // started with 1 in hand
    expect(p.deck.length).toBe(before - 1);
  });

  it('returns pendingYouriActivation: true when multiple face-down piecies', () => {
    const state = buildYouriState({ youriMP: 50, faceDownPiecies: 2 });
    const result = ability_youri_speed_activate(state, 'player_1');
    expect(result.success).toBe(true);
    expect(result.pendingYouriActivation).toBe(true);
    const p = result.state.players.player_1;
    // MP deducted
    expect(p.activeSlots[0].mp).toBe(30);
    // counter incremented
    expect(p.youriAbilityUses).toBe(1);
    // pending signal on state
    expect(result.state._pendingYouriActivation).toBeDefined();
    expect(result.state._pendingYouriActivation.faceDownSlots).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Chris+Youri passive synergy in playPiecie
// ─────────────────────────────────────────────────────────────────────────────
function buildSynergyState(chris: string | null, youriAlive: boolean, chrisDefeated = false) {
  const activeSlots: unknown[] = [];
  if (chris) {
    activeSlots.push({
      cardId: chris,
      name: 'Chris',
      traits: { physical: 3, technical: 2, social: 2 },
      mp: 30,
      level: 1,
      isDefeated: chrisDefeated,
      statusEffects: [],
      abilityUsedThisTurn: false,
    });
  } else {
    activeSlots.push(null);
  }
  if (youriAlive) {
    activeSlots.push({
      cardId: 'mosje_youri',
      name: '[Youri] The Speedrunner',
      traits: { technical: 3, mental: 2, resilient: 1 },
      mp: 30,
      level: 1,
      isDefeated: false,
      statusEffects: [],
      abilityUsedThisTurn: false,
    });
  } else {
    activeSlots.push(null);
  }
  return createEngineState({
    players: {
      player_1: {
        playerId: 'player_1',
        name: 'Test',
        deckId: 'DIGITAL_CONTROL',
        hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
        deck: [],
        discard: [],
        graveyard: [],
        welloe: [],
        activeSlots,
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        youriAbilityUses: 0,
      },
      player_2: {
        playerId: 'player_2',
        name: 'Opp',
        deckId: 'PHYSICAL_FORCE',
        hand: [],
        deck: [],
        discard: [],
        graveyard: [],
        welloe: [],
        activeSlots: [null, null],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        totalDamageTaken: 0,
        questPrepBonus: 0,
        hasAttemptedQuestThisTurn: false,
        hasRerolledDieThisTurn: false,
        youriAbilityUses: 0,
      },
    },
  });
}

describe('Chris+Youri passive synergy', () => {
  it('sets canActivateOnTurn to turnNumber when mosje_chris and mosje_youri both active', () => {
    const state = buildSynergyState('mosje_chris', true);
    const result = playPiecie(state, 'player_1', { cardId: 'piecie_kannetje_melk', type: 'PIECIE' });
    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber);
  });

  it('sets canActivateOnTurn to turnNumber when mosje_chris_ddr and mosje_youri both active', () => {
    const state = buildSynergyState('mosje_chris_ddr', true);
    const result = playPiecie(state, 'player_1', { cardId: 'piecie_kannetje_melk', type: 'PIECIE' });
    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber);
  });

  it('sets canActivateOnTurn to turnNumber+1 when only mosje_chris active (no Youri)', () => {
    const state = buildSynergyState('mosje_chris', false);
    const result = playPiecie(state, 'player_1', { cardId: 'piecie_kannetje_melk', type: 'PIECIE' });
    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber + 1);
  });

  it('sets canActivateOnTurn to turnNumber+1 when only mosje_youri active (no Chris)', () => {
    const state = buildSynergyState(null, true);
    const result = playPiecie(state, 'player_1', { cardId: 'piecie_kannetje_melk', type: 'PIECIE' });
    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber + 1);
  });

  it('sets canActivateOnTurn to turnNumber+1 when chris isDefeated=true and youri alive', () => {
    const state = buildSynergyState('mosje_chris', true, true); // chrisDefeated = true
    const result = playPiecie(state, 'player_1', { cardId: 'piecie_kannetje_melk', type: 'PIECIE' });
    expect(result.success).toBe(true);
    const placed = result.state.players.player_1.piecieSlots.find((s: any) => s !== null);
    expect(placed.canActivateOnTurn).toBe(state.turnNumber + 1);
  });
});
