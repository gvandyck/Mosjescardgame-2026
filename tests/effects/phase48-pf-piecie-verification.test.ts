// Phase 48 — Original Requirement Verification Backfill (Physical Force Piecie bucket).
//
// Gap-fill unit tests for the PF Piecie requirements (IMPL-PF-P1..P12) that Task 1's
// two-pronged evidence sweep (see 48-FRAGMENT-01-pf-piecies.md) confirmed have NO
// qualifying passing test anywhere in tests/ (D-01/D-02/D-03). Each test below calls
// the real effect function directly and asserts a concrete field delta that would fail
// if the effect body were deleted — no tautological/smoke-only assertions (D-02).
//
// Confirmed gaps closed here:
//   - effect_snoeiertje        (IMPL-PF-P3) — zero hits anywhere in tests/
//   - effect_dikke_taks        (IMPL-PF-P5) — zero hits anywhere in tests/
//   - effect_momentum_diefje   (IMPL-PF-P4) — only the entry-protection FIZZLE branch
//     was covered (tests/engine/entry-protection.test.ts); the happy-path steal on an
//     unprotected target was never asserted (Pitfall 2, 48-RESEARCH.md)
//   - effect_varkenspootjes    (IMPL-PF-P7) — the exported effect only sets a pending
//     target-selection flag (mechanic deferred to UI/bot resolution in main.js /
//     botDriver.js, neither of which is a unit-testable pure function); this test
//     asserts that deferred hand-off actually happens. The final MP swing
//     (Binti +60 / other -30) is resolved outside piecieEffects.js and is NOT covered
//     by a pure unit test — recorded as a residual coverage note in the fragment, not
//     silently claimed as fully verified (D-08).

import { describe, expect, it } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import {
  effect_snoeiertje,
  effect_dikke_taks,
  effect_momentum_diefje,
  effect_varkenspootjes,
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
    subtype: 'PHYSICAL',
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
      [makeMosje(options.cardId ?? 'mosje_chris', options.mp, options.tags), null],
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
        ...makePlayer({ cardId: 'mosje_gandoe_destroyer', ...player2Options }),
        playerId: 'player_2',
      },
    },
  };
}

describe('Phase 48 gap-fill — effect_snoeiertje (IMPL-PF-P3)', () => {
  it('grants +15 questBonusMP to the activating player', () => {
    const state = makeState();
    const result = effect_snoeiertje(state, 'player_1');
    expect(result.players.player_1.questBonusMP).toBe(15);
  });
});

describe('Phase 48 gap-fill — effect_dikke_taks (IMPL-PF-P5)', () => {
  it('deals 35 MP to the single opponent (below the 3+ opponent threshold) and draws 2 cards', () => {
    const state = makeState({
      deck: [
        { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
        { cardId: 'piecie_te_hard_gaan', type: 'PIECIE' },
      ],
    }, { mp: 80 });
    const result = effect_dikke_taks(state, 'player_1');

    expect(result.players.player_2.activeSlots[0].mp).toBe(45); // 80 - 35
    expect(result.players.player_1.hand).toHaveLength(2);
    expect(result.players.player_1.deck).toHaveLength(0);
  });
});

describe('Phase 48 gap-fill — effect_momentum_diefje happy path (IMPL-PF-P4)', () => {
  it('steals 20 MP from an UNPROTECTED opponent target and adds it to the activating Mosje', () => {
    const state = makeState({ mp: 50 }, { mp: 40 });
    // Ensure the target is not entry-protected (default undefined already satisfies
    // this, but state it explicitly since the fizzle branch this test complements
    // relies on the opposite value).
    state.players.player_2.activeSlots[0].entryProtected = false;

    const result = effect_momentum_diefje(state, 'player_1');

    expect(result.players.player_2.activeSlots[0].mp).toBe(20); // 40 - 20 stolen
    expect(result.players.player_1.activeSlots[0].mp).toBe(70); // 50 + 20 gained
  });
});

describe('Phase 48 gap-fill — effect_varkenspootjes deferred target selection (IMPL-PF-P7)', () => {
  it('sets a pending Varkenspootjes target-selection flag for the activating player', () => {
    const state = makeState();
    const result = effect_varkenspootjes(state, 'player_1');

    expect(result._varkenspootjesPending).toEqual({ activatingPlayerId: 'player_1' });
  });
});
