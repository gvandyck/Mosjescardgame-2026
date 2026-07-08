/**
 * Tests for src/bot/strategy/ — quest odds, risk decisions, activation
 * ordering, and profile lookup. Pure-function tests on small mock states;
 * the browser sim exercises the full loop.
 */
import { describe, expect, it } from 'vitest';

// @ts-expect-error JS module without type declarations
import { estimateQuestOdds } from '../../src/bot/strategy/questOdds.js';
// @ts-expect-error JS module without type declarations
import { assessQuestRisk, QUEST_ATTEMPT_COST } from '../../src/bot/strategy/assessQuestRisk.js';
// @ts-expect-error JS module without type declarations
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
// @ts-expect-error JS module without type declarations
import { getBotProfile, BOT_PROFILES, DEFAULT_BOT_PROFILE } from '../../src/bot/strategy/botProfiles.js';
// @ts-expect-error JS module without type declarations
import { QUESTS } from '../../src/data/quests.js';

const ARM_WRESTLING = (QUESTS as any[]).find(q => q.id === 'quest_arm_wrestling');
const SPEED_RUN = (QUESTS as any[]).find(q => q.requirementId === 'quest_req_speed_run');
const MOMENTUM_MASTER = (QUESTS as any[]).find(q => q.requirementId === 'quest_req_momentum_master');

function makeMosje(overrides: Record<string, unknown> = {}) {
  return {
    cardId: 'mosje_test',
    name: 'Test Mosje',
    mp: 50,
    level: 0,
    isDefeated: false,
    statusEffects: [],
    traits: { physical: 3 },
    ...overrides,
  };
}

function makeState(playerOverrides: Record<string, unknown> = {}, stateOverrides: Record<string, unknown> = {}) {
  return {
    activePlayerId: 'player_2',
    turnNumber: 5,
    activePlace: null,
    _snelleFlags: {},
    players: {
      player_2: {
        hand: [],
        piecieSlots: [null, null, null, null],
        activeSlots: [makeMosje()],
        questPrepBonus: 0,
        pieciesPlayedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        ...playerOverrides,
      },
    },
    ...stateOverrides,
  };
}

// ─────────────────────────────────────────────────────────────
// estimateQuestOdds
// ─────────────────────────────────────────────────────────────

describe('estimateQuestOdds', () => {
  it('uses the real trait threshold: Physical ★★★ on Arm Wrestling → 2+ → 5/6', () => {
    const state = makeState();
    const odds = estimateQuestOdds(ARM_WRESTLING, makeMosje({ traits: { physical: 3 } }), state, 'player_2');
    expect(odds.canAttempt).toBe(true);
    expect(odds.threshold).toBe(2);
    expect(odds.pSuccess).toBeCloseTo(5 / 6, 5);
  });

  it('weak trait raises the threshold: Physical ★ on Arm Wrestling → 5+ → 2/6', () => {
    const state = makeState();
    const odds = estimateQuestOdds(ARM_WRESTLING, makeMosje({ traits: { physical: 1 } }), state, 'player_2');
    expect(odds.threshold).toBe(5);
    expect(odds.pSuccess).toBeCloseTo(2 / 6, 5);
  });

  it('questPrepBonus improves the effective odds', () => {
    const state = makeState({ questPrepBonus: 2 });
    const weak = makeMosje({ traits: { physical: 1 } }); // base threshold 5
    const odds = estimateQuestOdds(ARM_WRESTLING, weak, state, 'player_2');
    expect(odds.diceBonus).toBe(2);
    expect(odds.pSuccess).toBeCloseTo(4 / 6, 5); // effectively needs 3+
  });

  it('Speed Run gate blocks after 2 Piecies were played this turn', () => {
    expect(SPEED_RUN).toBeDefined();
    const blocked = estimateQuestOdds(
      SPEED_RUN, makeMosje(), makeState({ pieciesPlayedThisTurn: 2 }), 'player_2');
    expect(blocked.canAttempt).toBe(false);
    const open = estimateQuestOdds(
      SPEED_RUN, makeMosje(), makeState({ pieciesPlayedThisTurn: 0 }), 'player_2');
    expect(open.canAttempt).toBe(true);
  });

  it('Momentum Master: auto-success in the 80-100 MP window, blocked outside it', () => {
    expect(MOMENTUM_MASTER).toBeDefined();
    const inWindow = estimateQuestOdds(MOMENTUM_MASTER, makeMosje({ mp: 90 }), makeState(), 'player_2');
    expect(inWindow.canAttempt).toBe(true);
    expect(inWindow.autoSuccess).toBe(true);
    expect(inWindow.pSuccess).toBe(1);
    const outside = estimateQuestOdds(MOMENTUM_MASTER, makeMosje({ mp: 50 }), makeState(), 'player_2');
    expect(outside.canAttempt).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// assessQuestRisk
// ─────────────────────────────────────────────────────────────

describe('assessQuestRisk', () => {
  const neutral = DEFAULT_BOT_PROFILE;

  it('skips when the Mosje cannot pay the 20 MP attempt cost', () => {
    const mosje = makeMosje({ mp: QUEST_ATTEMPT_COST - 5 });
    const d = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje, slotIndex: 0,
      gameState: makeState({ activeSlots: [mosje] }), playerId: 'player_2', profile: neutral,
    });
    expect(d.attempt).toBe(false);
    expect(d.reason).toBe('cannot-afford-cost');
  });

  it('attempts a safe, high-odds quest (Physical ★★★, plenty of MP)', () => {
    const mosje = makeMosje({ mp: 80 });
    const d = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje, slotIndex: 0,
      gameState: makeState({ activeSlots: [mosje] }), playerId: 'player_2', profile: neutral,
    });
    expect(d.attempt).toBe(true);
    expect(d.severity).toBe('safe');
  });

  it('refuses a quest that could defeat the LAST Mosje unless odds are excellent', () => {
    // mp 30 → 10 at roll; failMP -20 would drive it below 0 at Level 0.
    const mosje = makeMosje({ mp: 30, traits: { physical: 3 } }); // p = 5/6 ≈ 0.83
    const d = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje, slotIndex: 0,
      gameState: makeState({ activeSlots: [mosje], hand: [] }), playerId: 'player_2', profile: neutral,
    });
    expect(d.severity).toBe('fatal');
    expect(d.attempt).toBe(false); // 0.83 < 0.85 required for fatal risks
  });

  it('same spot with a backup Mosje on field is only "defeat" severity → attempts', () => {
    const mosje = makeMosje({ mp: 30, traits: { physical: 3 } });
    const backup = makeMosje({ cardId: 'mosje_backup', mp: 40 });
    const d = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje, slotIndex: 0,
      gameState: makeState({ activeSlots: [mosje, backup] }), playerId: 'player_2', profile: neutral,
    });
    expect(d.severity).toBe('defeat');
    expect(d.attempt).toBe(true); // 0.83 >= 0.7 required
  });

  it('risk tolerance separates the decks: GM gambles where CY holds back', () => {
    // Physical ★★ → threshold 3 → p = 4/6 ≈ 0.667; severity 'defeat' base 0.7.
    const scenario = () => {
      const mosje = makeMosje({ mp: 30, traits: { physical: 2 } });
      const backup = makeMosje({ cardId: 'mosje_backup', mp: 40 });
      return {
        questDef: ARM_WRESTLING, mosje, slotIndex: 0,
        gameState: makeState({ activeSlots: [mosje, backup] }), playerId: 'player_2',
      };
    };
    const gm = assessQuestRisk({ ...scenario(), profile: BOT_PROFILES.DUO_GANDOE_MICHELLE });
    const cy = assessQuestRisk({ ...scenario(), profile: BOT_PROFILES.DUO_CHRIS_YOURI });
    expect(gm.attempt).toBe(true);   // required ≈ 0.655
    expect(cy.attempt).toBe(false);  // required ≈ 0.715
  });

  it('a success that levels up lowers the required confidence', () => {
    const base = makeMosje({ mp: 30, traits: { physical: 2 } });
    const nearLevel = makeMosje({ mp: 62, traits: { physical: 2 } }); // 42 at roll + 60 = 102 → levels
    const backup = makeMosje({ cardId: 'mosje_backup', mp: 40 });
    const dBase = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje: base, slotIndex: 0,
      gameState: makeState({ activeSlots: [base, backup] }), playerId: 'player_2', profile: neutral,
    });
    const dLevel = assessQuestRisk({
      questDef: ARM_WRESTLING, mosje: nearLevel, slotIndex: 0,
      gameState: makeState({ activeSlots: [nearLevel, backup] }), playerId: 'player_2', profile: neutral,
    });
    expect(dLevel.levelsUp).toBe(true);
    expect(dLevel.requiredP).toBeLessThan(dBase.requiredP as number);
  });
});

// ─────────────────────────────────────────────────────────────
// planPiecieActivations
// ─────────────────────────────────────────────────────────────

function readySlot(cardId: string) {
  return { cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 4, canActivateOnTurn: 5 };
}

describe('planPiecieActivations', () => {
  it('activates the MP Amplifier before the Kannetje Melk it multiplies', () => {
    const state = makeState({
      piecieSlots: [readySlot('piecie_kannetje_melk'), readySlot('piecie_mp_amplifier'), null, null],
    });
    const plan = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(plan.map((p: any) => p.cardId)).toEqual(['piecie_mp_amplifier', 'piecie_kannetje_melk']);
  });

  it('skips quest-prep when no quest will follow this turn (bonus would be wasted)', () => {
    const state = makeState({
      piecieSlots: [readySlot('piecie_quest_prep'), readySlot('piecie_kannetje_melk'), null, null],
    });
    const noQuest = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: false });
    expect(noQuest.map((p: any) => p.cardId)).toEqual(['piecie_kannetje_melk']);
    const questing = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(questing.map((p: any) => p.cardId)).toContain('piecie_quest_prep');
  });

  it('high combo-patience holds a lone payoff card; low patience fires it', () => {
    const state = makeState({
      piecieSlots: [readySlot('piecie_chain_reaction'), null, null, null],
    });
    const patient = planPiecieActivations(state, 'player_2', { ...DEFAULT_BOT_PROFILE, comboPatience: 0.7 }, { willQuest: true });
    expect(patient).toHaveLength(0);
    const eager = planPiecieActivations(state, 'player_2', { ...DEFAULT_BOT_PROFILE, comboPatience: 0.2 }, { willQuest: true });
    expect(eager.map((p: any) => p.cardId)).toEqual(['piecie_chain_reaction']);
  });

  it('does not include slots that are not yet activatable', () => {
    const notReady = { ...readySlot('piecie_kannetje_melk'), canActivateOnTurn: 6 };
    const state = makeState({ piecieSlots: [notReady, null, null, null] });
    const plan = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(plan).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getBotProfile
// ─────────────────────────────────────────────────────────────

describe('getBotProfile', () => {
  it('resolves the duo-deck profile from player.deckId', () => {
    const state = makeState({ deckId: 'DUO_CHRIS_YOURI' });
    const profile = getBotProfile(state, 'player_2');
    expect(profile.archetype).toBe('setup-combo');
    expect(profile.deckId).toBe('DUO_CHRIS_YOURI');
  });

  it('falls back to the default profile for unknown/legacy decks', () => {
    const state = makeState({ deckId: 'PHYSICAL_FORCE' });
    const profile = getBotProfile(state, 'player_2');
    expect(profile.archetype).toBe(DEFAULT_BOT_PROFILE.archetype);
    expect(profile.deckId).toBe('PHYSICAL_FORCE');
  });
});
