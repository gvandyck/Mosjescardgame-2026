import { describe, expect, it } from 'vitest';
// @ts-expect-error - JavaScript module has no type declarations
import { effect_zo_is_natuur, effect_quest_haven } from '../../src/abilities/placeEffects.js';
// @ts-expect-error - JavaScript module has no type declarations
import {
  quest_req_shotje_obby,
  quest_req_leap_of_faith,
  quest_req_survive_storm,
  quest_req_never_give_up,
  quest_req_tough_it_out,
  quest_req_improvise,
  quest_req_create_masterpiece,
  quest_req_lucky_break,
  quest_req_synergy_mastery,
  quest_req_artistic_expression,
} from '../../src/abilities/questLogic.js';

// Phase 48-04 gap-fill: the two-pronged grep (id string AND effect/requirement
// function name, per RESEARCH.md's method) found NO qualifying outcome-asserting
// evidence anywhere in tests/ for these 11 Place/Quest rows — existing hits were
// either registry-membership-only (D-01 T3, not evidence) or a different feature's
// test reusing the card as a generic fixture without exercising its own logic
// (Pitfall 2 — e.g. quest_shotje_obby/quest_leap_of_faith were only used as inert
// fixtures for the Gandoe/Michelle synergy and General-Quest-affordability tests,
// never through their own quest_req_* function). Each test below calls the real
// exported function and asserts a concrete field delta/threshold/flag that would
// fail if the requirement's own logic were removed or changed, per D-02.

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

// ─────────────────────────────────────────────────────────────
// IMPL-PF-Q3 — quest_shotje_obby (quest_req_shotje_obby)
// ─────────────────────────────────────────────────────────────
describe('quest_req_shotje_obby (IMPL-PF-Q3 gap-fill)', () => {
  it('auto-succeeds when Obby #1 is the active Place', () => {
    const gameState = makeState([makeMosje('mosje_chris', 40)], 'place_obby_1');
    const result = quest_req_shotje_obby({ id: 'quest_shotje_obby' }, { cardId: 'mosje_chris', traits: {} }, gameState);
    expect(result.canAttempt).toBe(true);
    expect(result.success).toBe(true);
    expect(result.autoSuccess).toBe(true);
  });

  it('requires a 4+ roll (no auto-success) when a different Place is active', () => {
    const gameState = makeState([makeMosje('mosje_chris', 40)], 'place_the_gym');
    const result = quest_req_shotje_obby({ id: 'quest_shotje_obby' }, { cardId: 'mosje_chris', traits: {} }, gameState);
    expect(result.canAttempt).toBe(true);
    expect(result.autoSuccess).toBeUndefined();
    expect(result.threshold).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-PF-Q4 — quest_leap_of_faith (quest_req_leap_of_faith)
// ─────────────────────────────────────────────────────────────
describe('quest_req_leap_of_faith (IMPL-PF-Q4 gap-fill)', () => {
  it('requires a roll of 4+ regardless of Mosje traits', () => {
    const result = quest_req_leap_of_faith({ id: 'quest_leap_of_faith' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(4);
    expect(result.success).toBe(result.diceRoll >= 4);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-PF-Q5 — quest_survive_storm (quest_req_survive_storm)
// ─────────────────────────────────────────────────────────────
describe('quest_req_survive_storm (IMPL-PF-Q5 gap-fill)', () => {
  it('Resilient ★★★ lowers the threshold to 2', () => {
    const result = quest_req_survive_storm({ id: 'quest_survive_storm' }, { cardId: 'mosje_chris', traits: { resilient: 3 } });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(2);
  });

  it('no Resilient trait falls back to threshold 5', () => {
    const result = quest_req_survive_storm({ id: 'quest_survive_storm' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-PF-Q6 — quest_never_give_up (quest_req_never_give_up)
// ─────────────────────────────────────────────────────────────
describe('quest_req_never_give_up (IMPL-PF-Q6 gap-fill)', () => {
  it('auto-succeeds when the Mosje is below 30 MP', () => {
    const result = quest_req_never_give_up({ id: 'quest_never_give_up' }, { cardId: 'mosje_chris', traits: {}, mp: 20 });
    expect(result.canAttempt).toBe(true);
    expect(result.success).toBe(true);
    expect(result.autoSuccess).toBe(true);
  });

  it('requires a 4+ roll (no auto-success) when at or above 30 MP', () => {
    const result = quest_never_give_up_at30();
    expect(result.canAttempt).toBe(true);
    expect(result.autoSuccess).toBeUndefined();
    expect(result.threshold).toBe(4);
  });

  function quest_never_give_up_at30() {
    return quest_req_never_give_up({ id: 'quest_never_give_up' }, { cardId: 'mosje_chris', traits: {}, mp: 30 });
  }
});

// ─────────────────────────────────────────────────────────────
// IMPL-PF-Q7 — quest_tough_it_out (quest_req_tough_it_out)
// Also the canonical evidence for IMPL-PF-P12 (REQUIREMENTS.md filing duplicate —
// see 48-FRAGMENT-04-places-quests-crosscut.md).
// ─────────────────────────────────────────────────────────────
describe('quest_req_tough_it_out (IMPL-PF-Q7 gap-fill, canonical for IMPL-PF-P12)', () => {
  it('Resilient ★★★ lowers the threshold to 2', () => {
    const result = quest_req_tough_it_out({ id: 'quest_tough_it_out' }, { cardId: 'mosje_chris', traits: { resilient: 3 } });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(2);
  });

  it('no Resilient trait falls back to threshold 5', () => {
    const result = quest_req_tough_it_out({ id: 'quest_tough_it_out' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-Q1 — quest_artistic_expression (quest_req_artistic_expression)
// Partial pre-existing coverage: quest-behaviors.test.ts proves the generic
// drawOnSuccess mechanism AND that this card's data has drawOnSuccess===2, but
// nothing calls quest_req_artistic_expression itself to prove the Creative ★★
// auto-succeed gate — that gap is closed here.
// ─────────────────────────────────────────────────────────────
describe('quest_req_artistic_expression (IMPL-AR-Q1 gap-fill — auto-succeed gate)', () => {
  it('auto-succeeds for a Creative ★★ Mosje', () => {
    const result = quest_req_artistic_expression({ id: 'quest_artistic_expression' }, { cardId: 'mosje_chris', traits: { creative: 2 } });
    expect(result.canAttempt).toBe(true);
    expect(result.success).toBe(true);
  });

  it('cannot attempt with Creative below ★★', () => {
    const result = quest_req_artistic_expression({ id: 'quest_artistic_expression' }, { cardId: 'mosje_chris', traits: { creative: 1 } });
    expect(result.canAttempt).toBe(false);
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-Q2 — quest_improvise (quest_req_improvise)
// ─────────────────────────────────────────────────────────────
describe('quest_req_improvise (IMPL-AR-Q2 gap-fill)', () => {
  it('Creative ★★★ lowers the threshold to 2', () => {
    const result = quest_req_improvise({ id: 'quest_improvise' }, { cardId: 'mosje_chris', traits: { creative: 3 } });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(2);
  });

  it('no Creative trait falls back to threshold 5', () => {
    const result = quest_req_improvise({ id: 'quest_improvise' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-Q3 — quest_create_masterpiece (quest_req_create_masterpiece)
// ─────────────────────────────────────────────────────────────
describe('quest_req_create_masterpiece (IMPL-AR-Q3 gap-fill)', () => {
  it('Creative ★★★ lowers the threshold to 3', () => {
    const result = quest_req_create_masterpiece({ id: 'quest_create_masterpiece' }, { cardId: 'mosje_chris', traits: { creative: 3 } });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(3);
  });

  it('no Creative trait falls back to threshold 6', () => {
    const result = quest_req_create_masterpiece({ id: 'quest_create_masterpiece' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-Q4 — quest_lucky_break (quest_req_lucky_break)
// ─────────────────────────────────────────────────────────────
describe('quest_req_lucky_break (IMPL-AR-Q4 gap-fill)', () => {
  it('requires a fixed roll of 3+ regardless of Mosje traits', () => {
    const result = quest_req_lucky_break({ id: 'quest_lucky_break' }, { cardId: 'mosje_chris', traits: {} });
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(3);
    expect(result.success).toBe(result.diceRoll >= 3);
  });
});

// ─────────────────────────────────────────────────────────────
// IMPL-AR-Q5 — quest_synergy_mastery (quest_req_synergy_mastery)
// ─────────────────────────────────────────────────────────────
describe('quest_req_synergy_mastery (IMPL-AR-Q5 gap-fill)', () => {
  it('lowers the threshold to 3 when a Synergy Mosje is on field', () => {
    const gameState = makeState([makeMosje('mosje_chris', 40, { synergy: 1 })]);
    const result = quest_req_synergy_mastery({ id: 'quest_synergy_mastery' }, { cardId: 'mosje_chris', traits: {} }, gameState);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(3);
  });

  it('falls back to threshold 5 without a Synergy Mosje on field', () => {
    const gameState = makeState([makeMosje('mosje_chris', 40)]);
    const result = quest_req_synergy_mastery({ id: 'quest_synergy_mastery' }, { cardId: 'mosje_chris', traits: {} }, gameState);
    expect(result.canAttempt).toBe(true);
    expect(result.threshold).toBe(5);
  });
});
