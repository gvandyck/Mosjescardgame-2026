/**
 * Tests for src/bot/strategy/ — quest odds, risk decisions, activation
 * ordering, and profile lookup. Pure-function tests on small mock states;
 * the browser sim exercises the full loop.
 */
import { describe, expect, it } from 'vitest';

// @ts-expect-error JS module without type declarations
import { classifyLossSeverity, getRequiredConfidence } from '../../src/bot/strategy/assessQuestRisk.js';
// @ts-expect-error JS module without type declarations
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
// @ts-expect-error JS module without type declarations
import { getBotProfile, BOT_PROFILES, DEFAULT_BOT_PROFILE } from '../../src/bot/strategy/botProfiles.js';


function makeMosje(overrides: Record<string, unknown> = {}) {
  return {
    cardId: 'mosje_test',
    name: 'Test Mosje',
    mp: 50,
    level: 1,
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

  it('gives each Example Deck the profile from its Playing it notes (61-04)', () => {
    const profileOf = (deckId: string) => getBotProfile(makeState({ deckId }), 'player_2');
    expect(profileOf('EXAMPLE_TAKSEN')).toMatchObject({ archetype: 'aggressive', riskTolerance: 0.6, comboPatience: 0.2, preferAttack: true });
    expect(profileOf('EXAMPLE_REGELAARS')).toMatchObject({ archetype: 'setup-control', riskTolerance: 0.45, comboPatience: 0.6, preferAttack: false });
    expect(profileOf('EXAMPLE_CREATIEVELINGEN')).toMatchObject({ archetype: 'tempo-sustain', riskTolerance: 0.5, comboPatience: 0.4, preferAttack: false });
  });

  it('falls back to the default profile for unknown/legacy decks', () => {
    const state = makeState({ deckId: 'PHYSICAL_FORCE' });
    const profile = getBotProfile(state, 'player_2');
    expect(profile.archetype).toBe(DEFAULT_BOT_PROFILE.archetype);
    expect(profile.deckId).toBe('PHYSICAL_FORCE');
  });
});

// ─────────────────────────────────────────────────────────────
// classifyLossSeverity / getRequiredConfidence
// Extracted from assessQuestRisk's inline logic so any fixed-or-variable-odds
// MP risk (a quest roll, or a flat gamble ability) can be judged the same way.
// ─────────────────────────────────────────────────────────────

describe('classifyLossSeverity', () => {
  const state = (activeSlots: any[], hand: any[] = []) => ({
    players: { player_2: { activeSlots, hand } },
  });

  it('none — zero loss is never a risk', () => {
    expect(classifyLossSeverity({ mpBefore: 5, level: 1, lossAmount: 0 })).toBe('none');
  });

  it('safe — MP stays above 0 after the loss', () => {
    const sev = classifyLossSeverity({
      mpBefore: 30, level: 1, lossAmount: 15,
      gameState: state([makeMosje({ mp: 30 })]), playerId: 'player_2', slotIndex: 0,
    });
    expect(sev).toBe('safe');
  });

  it('regress — would drop below 0 but the Mosje has a level to lose', () => {
    const sev = classifyLossSeverity({
      mpBefore: 10, level: 2, lossAmount: 15,
      gameState: state([makeMosje({ mp: 10, level: 2 })]), playerId: 'player_2', slotIndex: 0,
    });
    expect(sev).toBe('regress');
  });

  it('landing exactly on 0 is getemt in 2.0 (E4)', () => {
    expect(classifyLossSeverity({ mpBefore: 15, level: 1, lossAmount: 15 })).toBe('sideways');
    expect(classifyLossSeverity({ mpBefore: 15, level: 2, lossAmount: 15 })).toBe('regress');
  });

  it('sideways — upright Level 1 would be getemt (MP 0, sits out a turn)', () => {
    const sev = classifyLossSeverity({ mpBefore: 10, level: 1, lossAmount: 15, sideways: false });
    expect(sev).toBe('sideways');
  });

  it('fatal — an already-sideways Mosje would be getemt again (Welloe pile)', () => {
    const sev = classifyLossSeverity({ mpBefore: 0, level: 1, lossAmount: 15, sideways: true });
    expect(sev).toBe('fatal');
  });
});

describe('getRequiredConfidence', () => {
  it('demands more confidence for worse severities, neutral profile', () => {
    const none = getRequiredConfidence('none', DEFAULT_BOT_PROFILE);
    const safe = getRequiredConfidence('safe', DEFAULT_BOT_PROFILE);
    const fatal = getRequiredConfidence('fatal', DEFAULT_BOT_PROFILE);
    expect(none).toBeLessThan(safe);
    expect(safe).toBeLessThan(fatal);
  });

  it('higher risk tolerance lowers the bar; lower tolerance raises it', () => {
    const cautious = getRequiredConfidence('sideways', { riskTolerance: 0.3 });
    const neutral = getRequiredConfidence('sideways', { riskTolerance: 0.5 });
    const bold = getRequiredConfidence('sideways', { riskTolerance: 0.7 });
    expect(cautious).toBeGreaterThan(neutral);
    expect(bold).toBeLessThan(neutral);
  });

  it('a game-winning payoff lowers the bar more than a mere level-up', () => {
    const plain = getRequiredConfidence('safe', DEFAULT_BOT_PROFILE);
    const levels = getRequiredConfidence('safe', DEFAULT_BOT_PROFILE, { levelsUp: true });
    const wins = getRequiredConfidence('safe', DEFAULT_BOT_PROFILE, { winsGame: true });
    expect(levels).toBeLessThan(plain);
    expect(wins).toBeLessThan(levels);
  });

});
