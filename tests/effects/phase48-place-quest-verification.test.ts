import { describe, expect, it } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import { effect_zo_is_natuur, effect_quest_haven } from '../../src/abilities/placeEffects.js';

// Phase 48-04 gap-fill for the two Place effects below.
// Phase 56-08: the ten V4 quest_req_* describes that used to follow (shotje_obby, leap_of_faith,
// survive_storm, never_give_up, tough_it_out, artistic_expression, improvise, create_masterpiece,
// lucky_break, synergy_mastery) tested V4 per-trait thresholds and are deleted. 2.0 counterparts:
//   - gates (Shotje Obby, Never Give Up, Synergy Mastery): quest-costs.test.ts "E20 - conditions"
//   - thresholds -> dice per star, bands and win/lose values: quest-dice.test.ts, quest-bands.test.ts

function makeMosje(cardId: string, mp = 50, traits: Record<string, number> = {}) {
  return {
    cardId,
    name: cardId,
    subtype: 'ARTISTIC',
    tags: [],
    traits,
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

function makeState(activeSlots: Array<Record<string, unknown> | null>, activePlace: string | null = null) {
  return {
    roomCode: 'TEST',
    status: 'PLAYING',
    activePlayerId: 'player_1',
    turnNumber: 2,
    activePlace,
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

// ─────────────────────────────────────────────────────────────
// IMPL-PF-PL2 — place_zo_is_natuur (effect_zo_is_natuur)
// ─────────────────────────────────────────────────────────────
describe('effect_zo_is_natuur (IMPL-PF-PL2 gap-fill)', () => {
  it('grants a non-Resilient Mosje +10 MP', () => {
    const state = makeState([makeMosje('mosje_chris', 40), null]);
    const result = effect_zo_is_natuur(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it('grants a Resilient Mosje +15 MP instead of +10', () => {
    const state = makeState([makeMosje('mosje_chris', 40, { resilient: 2 }), null]);
    const result = effect_zo_is_natuur(state);
    expect(result.players.player_1.activeSlots[0].mp).toBe(55);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-PL2 — place_quest_haven (effect_quest_haven)
// ─────────────────────────────────────────────────────────────
describe('effect_quest_haven (IMPL-AR-PL2 gap-fill)', () => {
  it('grants +10 MP to the questing slot on a successful quest', () => {
    const state = makeState([makeMosje('mosje_chris', 40), null]);
    const result = effect_quest_haven(state, true, 1, 0);
    expect(result.players.player_1.activeSlots[0].mp).toBe(50);
  });

  it('does nothing on a failed quest', () => {
    const state = makeState([makeMosje('mosje_chris', 40), null]);
    const result = effect_quest_haven(state, false, 1, 0);
    expect(result.players.player_1.activeSlots[0].mp).toBe(40);
  });

  it('grants an extra +25 MP bonus when 2 quests were completed this turn', () => {
    const state = makeState([makeMosje('mosje_chris', 40), null]);
    const result = effect_quest_haven(state, true, 2, 0);
    // +10 base reward, +25 double-quest bonus = +35 total
    expect(result.players.player_1.activeSlots[0].mp).toBe(75);
  });
});
