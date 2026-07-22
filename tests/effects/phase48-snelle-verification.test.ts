import { describe, expect, it } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import {
  effect_snelle_bijna_welloe,
  effect_snelle_dubbele_temminks,
} from '../../src/abilities/snelleEffects.js';

// Phase 48-03 gap-fill: IMPL-PF-S2/IMPL-AR-S2 (snelle_bijna_welloe) and
// IMPL-AR-S4 (snelle_dubbele_temminks) had no existing test evidence anywhere
// in tests/ (checked by both id-string and effect-function-name grep). These
// tests assert a concrete field delta per D-02's false-green guard — each
// would fail if the effect body were removed or replaced with a no-op.

function makeMosje(cardId: string, mp = 50) {
  return {
    cardId,
    name: cardId,
    subtype: 'ARTISTIC',
    tags: [],
    traits: {},
    mp,
    level: 1,
    isDefeated: false,
    statusEffects: [],
    abilityUsedThisTurn: false,
    mpLostThisTurn: 0,
  };
}

function makePlayer(activeSlots: Array<Record<string, unknown> | null>) {
  return {
    playerId: 'player_1',
    hand: [],
    deck: [],
    graveyard: [],
    activeSlots,
    piecieSlots: [null, null, null, null],
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

function makeState(activeSlots: Array<Record<string, unknown> | null>) {
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
      player_1: makePlayer(activeSlots),
      player_2: {
        ...makePlayer([makeMosje('mosje_gandoe_destroyer'), null]),
        playerId: 'player_2',
      },
    },
  };
}

describe('effect_snelle_bijna_welloe (IMPL-PF-S2 / IMPL-AR-S2 gap-fill)', () => {
  it('heals the active Mosje by +20 MP when at or below 10 MP', () => {
    const state = makeState([makeMosje('mosje_chris', 10), null]);
    const result = effect_snelle_bijna_welloe(state, 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it('does not heal when the active Mosje is above 10 MP', () => {
    const state = makeState([makeMosje('mosje_chris', 11), null]);
    const result = effect_snelle_bijna_welloe(state, 'player_1');
    expect(result.players.player_1.activeSlots[0].mp).toBe(11);
  });
});

describe('effect_snelle_dubbele_temminks (IMPL-AR-S4 gap-fill)', () => {
  it('sets the doubleNextPiecie flag for the acting player', () => {
    const state = makeState([makeMosje('mosje_chris', 50), null]);
    const result = effect_snelle_dubbele_temminks(state, 'player_1');
    expect(result._snelleFlags.doubleNextPiecie.player_1).toBe(true);
  });

  it('does not set the flag for the opponent', () => {
    const state = makeState([makeMosje('mosje_chris', 50), null]);
    const result = effect_snelle_dubbele_temminks(state, 'player_1');
    expect(result._snelleFlags.doubleNextPiecie.player_2).toBeUndefined();
  });
});
