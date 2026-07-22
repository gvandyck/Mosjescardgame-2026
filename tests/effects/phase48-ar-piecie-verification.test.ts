// Phase 48 — Original Requirement Verification Backfill (Artistic Rhythm Piecie bucket).
//
// Gap-fill unit tests for the AR Piecie requirements (IMPL-AR-P1..P13) that Task 1's
// two-pronged evidence sweep (see 48-FRAGMENT-02-ar-piecies.md) confirmed have NO
// qualifying passing test anywhere in tests/ (D-01/D-02/D-03). Each test below calls
// the real effect function directly and asserts a concrete field delta that would fail
// if the effect body were deleted — no tautological/smoke-only assertions (D-02).
//
// Confirmed gaps closed here:
//   - effect_warm_kannetje_melk (IMPL-AR-P2) — zero hits anywhere in tests/. Per direct
//     read of src/abilities/piecieEffects.js:215-225, this card LOSES 10 MP (not a
//     gain, despite the "Kannetje Melk" family name) and draws min(2, deck.length)
//     cards.
//   - effect_dubbele_ding       (IMPL-AR-P10) — zero hits anywhere in tests/. Per direct
//     read of src/abilities/piecieEffects.js:492-500, sets instantPiecieThisTurn=true
//     and dubbeleActivations=2.

import { describe, expect, it } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import {
  effect_warm_kannetje_melk,
  effect_dubbele_ding,
} from '../../src/abilities/piecieEffects.js';

type StateOptions = {
  cardId?: string;
  mp?: number;
  tags?: string[];
  activeSlots?: Array<Record<string, unknown> | null>;
  hand?: Array<{ cardId: string; type: string }>;
  deck?: Array<{ cardId: string; type: string }>;
  piecieSlots?: Array<Record<string, unknown> | null>;
};

function makeMosje(cardId: string, mp = 50, tags?: string[]) {
  return {
    cardId,
    name: cardId,
    subtype: 'ARTISTIC',
    tags,
    traits: {},
    mp,
    level: 1,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    mpLostThisTurn: 0,
  };
}

function makePlayer(options: StateOptions = {}) {
  return {
    playerId: 'player_1',
    hand: options.hand ?? [],
    deck: options.deck ?? [],
    graveyard: [],
    activeSlots:
      options.activeSlots ??
      [makeMosje(options.cardId ?? 'mosje_jisca', options.mp, options.tags), null],
    piecieSlots: options.piecieSlots ?? [null, null, null, null],
    questPrepBonus: 0,
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    pieciesActivatedThisTurn: 0,
    pieciesPlayedThisTurn: 0,
    actionsThisTurn: [],
    totalDamageTaken: 0,
  };
}

function makeState(
  player1Options: StateOptions = {},
  player2Options: StateOptions = {},
) {
  return {
    roomCode: 'TEST',
    status: 'PLAYING',
    activePlayerId: 'player_1',
    turnNumber: 2,
    activePlace: null,
    activeQuest: null,
    sharedPlaceSlot: null,
    winnerId: null,
    winReason: null,
    _snelleFlags: {},
    _pendingTargets: {},
    sharedGeneralQuestDiscard: [],
    players: {
      player_1: makePlayer(player1Options),
      player_2: {
        ...makePlayer({ cardId: 'mosje_dj_8020', ...player2Options }),
        playerId: 'player_2',
      },
    },
  };
}

describe('Phase 48 gap-fill — effect_warm_kannetje_melk (IMPL-AR-P2)', () => {
  it('loses 10 MP from the activating Mosje and draws min(2, deck.length) cards', () => {
    const state = makeState({
      mp: 50,
      deck: [
        { cardId: 'piecie_bowie_stormey', type: 'PIECIE' },
        { cardId: 'piecie_gekke_vogels', type: 'PIECIE' },
      ],
    });

    const result = effect_warm_kannetje_melk(state, 'player_1');

    expect(result.players.player_1.activeSlots[0].mp).toBe(40); // 50 - 10 (loses MP)
    expect(result.players.player_1.hand).toHaveLength(2);
    expect(result.players.player_1.deck).toHaveLength(0);
  });

  it('draws fewer than 2 cards when the deck has fewer than 2 remaining', () => {
    const state = makeState({
      mp: 30,
      deck: [{ cardId: 'piecie_bowie_stormey', type: 'PIECIE' }],
    });

    const result = effect_warm_kannetje_melk(state, 'player_1');

    expect(result.players.player_1.activeSlots[0].mp).toBe(20); // 30 - 10
    expect(result.players.player_1.hand).toHaveLength(1);
    expect(result.players.player_1.deck).toHaveLength(0);
  });
});

describe('Phase 48 gap-fill — effect_dubbele_ding (IMPL-AR-P10)', () => {
  it('grants instantPiecieThisTurn and 2 instant Piecie activations from hand', () => {
    const state = makeState();

    const result = effect_dubbele_ding(state, 'player_1');

    expect(result.players.player_1.instantPiecieThisTurn).toBe(true);
    expect(result.players.player_1.dubbeleActivations).toBe(2);
  });
});
