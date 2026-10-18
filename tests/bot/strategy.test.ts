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
import { isUsefulActivation } from '../../src/bot/strategy/isUsefulActivation.js';
// @ts-expect-error JS module without type declarations
import { COMBO_TAGS, getCardTags } from '../../src/bot/strategy/comboTags.js';
// @ts-expect-error JS module without type declarations
import { PIECIES } from '../../src/data/piecies.js';
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

// 2.0 table: 3 Piecie slots, 6 Energy, and an opponent (player_1) with one Mosje that is not fresh.
function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    hand: [],
    piecieSlots: [null, null, null],
    activeSlots: [makeMosje()],
    energy: 6,
    questPrepBonus: 0,
    pieciesPlayedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    ...overrides,
  };
}

function makeState(
  playerOverrides: Record<string, unknown> = {},
  stateOverrides: Record<string, unknown> = {},
  opponentOverrides: Record<string, unknown> = {},
) {
  return {
    activePlayerId: 'player_2',
    turnNumber: 5,
    activePlace: null,
    _snelleFlags: {},
    players: {
      player_1: makePlayer({ activeSlots: [makeMosje({ cardId: 'mosje_opponent', name: 'Opponent Mosje' })], ...opponentOverrides }),
      player_2: makePlayer(playerOverrides),
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
      piecieSlots: [readySlot('piecie_kannetje_melk'), readySlot('piecie_mp_amplifier'), null],
    });
    const plan = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(plan.map((p: any) => p.cardId)).toEqual(['piecie_mp_amplifier', 'piecie_kannetje_melk']);
  });

  it('skips quest-prep when no quest will follow this turn (bonus would be wasted)', () => {
    const state = makeState({
      piecieSlots: [readySlot('piecie_quest_prep'), readySlot('piecie_kannetje_melk'), null],
    });
    const noQuest = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: false });
    expect(noQuest.map((p: any) => p.cardId)).toEqual(['piecie_kannetje_melk']);
    const questing = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(questing.map((p: any) => p.cardId)).toContain('piecie_quest_prep');
  });

  it('high combo-patience holds a lone payoff card; low patience fires it', () => {
    const state = makeState({
      piecieSlots: [readySlot('piecie_chain_reaction'), null, null],
    });
    const patient = planPiecieActivations(state, 'player_2', { ...DEFAULT_BOT_PROFILE, comboPatience: 0.7 }, { willQuest: true });
    expect(patient).toHaveLength(0);
    const eager = planPiecieActivations(state, 'player_2', { ...DEFAULT_BOT_PROFILE, comboPatience: 0.2 }, { willQuest: true });
    expect(eager.map((p: any) => p.cardId)).toEqual(['piecie_chain_reaction']);
  });

  it('does not include slots that are not yet activatable', () => {
    const notReady = { ...readySlot('piecie_kannetje_melk'), canActivateOnTurn: 6 };
    const state = makeState({ piecieSlots: [notReady, null, null] });
    const plan = planPiecieActivations(state, 'player_2', DEFAULT_BOT_PROFILE, { willQuest: true });
    expect(plan).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────
// planPiecieActivations: legal, affordable and useful (61-05)
// ─────────────────────────────────────────────────────────────

describe('planPiecieActivations - legal, affordable and useful (61-05)', () => {
  const slotsOf = (...ids: string[]) => {
    const slots: unknown[] = ids.map(readySlot);
    while (slots.length < 3) slots.push(null);
    return slots;
  };
  const planIds = (state: unknown, profile: unknown = DEFAULT_BOT_PROFILE, intent: Record<string, unknown> = { willQuest: true }) =>
    planPiecieActivations(state, 'player_2', profile, intent).map((p: any) => p.cardId);
  const jammer = (mp = 50, extra: Record<string, unknown> = {}) => makeMosje({ mp, ...extra });

  describe('Energy budget', () => {
    const three = ['piecie_ronald_kip', 'piecie_broodje_doner', 'piecie_kannetje_melk'];
    it('plans all three at budget 3 (cost 2 + 1 + 0)', () => {
      const state = makeState({ piecieSlots: slotsOf(...three) });
      expect([...planIds(state, DEFAULT_BOT_PROFILE, { willQuest: true, budget: 3 })].sort()).toEqual([...three].sort());
    });
    it('at budget 2 plans Kannetje Melk plus one of the others only', () => {
      const state = makeState({ piecieSlots: slotsOf(...three) });
      const ids = planIds(state, DEFAULT_BOT_PROFILE, { willQuest: true, budget: 2 });
      expect(ids).toHaveLength(2);
      expect(ids).toContain('piecie_kannetje_melk');
    });
    it('defaults the budget to the player Energy', () => {
      const poor = makeState({ energy: 0, piecieSlots: slotsOf(...three) });
      expect(planIds(poor)).toEqual(['piecie_kannetje_melk']);
      const rich = makeState({ energy: 6, piecieSlots: slotsOf(...three) });
      expect(planIds(rich)).toHaveLength(3);
    });
    it('counts the Delluft parking fee in the cost', () => {
      const slots = slotsOf('piecie_broodje_doner'); // cost 1 + fee 1
      expect(planIds(makeState({ energy: 1, piecieSlots: slots }, { activePlace: 'place_delluft' }))).toEqual([]);
      expect(planIds(makeState({ energy: 2, piecieSlots: slots }, { activePlace: 'place_delluft' }))).toEqual(['piecie_broodje_doner']);
    });
  });

  describe('engine gate', () => {
    it('Jeffrey, The Strongman on the field: no Piecie that gives MP is planned', () => {
      const state = makeState({ activeSlots: [jammer(50, { cardId: 'mosje_jeffrey' })], piecieSlots: slotsOf('piecie_kannetje_melk', 'piecie_pot_of_weed') });
      expect(planIds(state)).toEqual(['piecie_pot_of_weed']);
    });
    it('Harde Didde needs an own Level 2+ Mosje (even with a target at 40 MP)', () => {
      const slots = slotsOf('piecie_harde_didde');
      const opp = { activeSlots: [makeMosje({ cardId: 'mosje_opponent', mp: 40 })] };
      expect(planIds(makeState({ activeSlots: [jammer(50, { level: 1 })], piecieSlots: slots }, {}, opp))).toEqual([]);
      expect(planIds(makeState({ activeSlots: [jammer(50, { level: 2 })], piecieSlots: slots }, {}, opp))).toEqual(['piecie_harde_didde']);
    });
  });

  describe('useless activations are skipped', () => {
    const teHardGaan = slotsOf('piecie_te_hard_gaan');
    it('Te Hard Gaan: planned with a non-fresh unacted Mosje and a valid target', () => {
      expect(planIds(makeState({ piecieSlots: teHardGaan }))).toEqual(['piecie_te_hard_gaan']);
    });
    it('Te Hard Gaan: not planned when every own Mosje is fresh', () => {
      expect(planIds(makeState({ activeSlots: [jammer(50, { entryProtected: true })], piecieSlots: teHardGaan }))).toEqual([]);
    });
    it('Te Hard Gaan: not planned when every own Mosje already acted', () => {
      expect(planIds(makeState({ activeSlots: [jammer(50, { actedThisTurn: true })], piecieSlots: teHardGaan }))).toEqual([]);
    });
    it('Te Hard Gaan: not planned when no opponent Mosje is a valid attack target', () => {
      const fresh = { activeSlots: [makeMosje({ cardId: 'mosje_opponent', entryProtected: true })] };
      expect(planIds(makeState({ piecieSlots: teHardGaan }, {}, fresh))).toEqual([]);
      expect(planIds(makeState({ piecieSlots: teHardGaan }, {}, { activeSlots: [null, null] }))).toEqual([]);
    });
    it('the Void: Kannetje Melk is not planned, Pot of Weed (draw) still is', () => {
      const state = makeState({ piecieSlots: slotsOf('piecie_kannetje_melk', 'piecie_pot_of_weed') }, { activePlace: 'place_the_void' });
      expect(planIds(state)).toEqual(['piecie_pot_of_weed']);
    });
    it('every own Mosje at Level 3 and 95 MP: no MP gain is planned; one that can still gain brings it back', () => {
      const slots = slotsOf('piecie_kannetje_melk');
      const capped = jammer(95, { level: 3 });
      expect(planIds(makeState({ activeSlots: [capped], piecieSlots: slots }))).toEqual([]);
      expect(planIds(makeState({ activeSlots: [capped, jammer(50)], piecieSlots: slots }))).toEqual(['piecie_kannetje_melk']);
    });
    it('Harde Didde needs a non-fresh opponent at 40 MP or less; Klaar Met Jou at 30 MP or less', () => {
      const own = [jammer(50, { level: 2 })];
      const opp = (mp: number, extra: Record<string, unknown> = {}) => ({ activeSlots: [makeMosje({ cardId: 'mosje_opponent', mp, ...extra })] });
      const harde = slotsOf('piecie_harde_didde');
      const klaar = slotsOf('piecie_klaar_met_jou');
      expect(planIds(makeState({ activeSlots: own, piecieSlots: harde }, {}, opp(45)))).toEqual([]);
      expect(planIds(makeState({ activeSlots: own, piecieSlots: harde }, {}, opp(40)))).toEqual(['piecie_harde_didde']);
      expect(planIds(makeState({ activeSlots: own, piecieSlots: harde }, {}, opp(40, { entryProtected: true })))).toEqual([]);
      expect(planIds(makeState({ activeSlots: own, piecieSlots: klaar }, {}, opp(40)))).toEqual([]);
      expect(planIds(makeState({ activeSlots: own, piecieSlots: klaar }, {}, opp(30)))).toEqual(['piecie_klaar_met_jou']);
    });
    it('Place destroyers only while a Place the opponent played is in play', () => {
      const ids = ['piecie_slecht_gezet', 'piecie_bong_hit_demolition', 'piecie_popo_komt', 'piecie_huisbaas'];
      const table = { activeSlots: [makeMosje({ cardId: 'mosje_opponent' }), makeMosje({ cardId: 'mosje_opponent_2' })], graveyard: [{ cardId: 'piecie_pot_of_weed', type: 'PIECIE' }] };
      const mine = { activeSlots: [jammer()], energy: 10, piecieSlots: slotsOf(ids[0], ids[1], ids[2]) };
      const theirPlace = { activePlace: 'place_the_gym', activePlacePlayedBy: 'player_1' };
      const ownPlace = { activePlace: 'place_the_gym', activePlacePlayedBy: 'player_2' };
      expect([...planIds(makeState(mine, theirPlace, table))].sort()).toEqual([ids[0], ids[1], ids[2]].sort());
      expect(planIds(makeState(mine, ownPlace, table))).toEqual([]);
      expect(planIds(makeState(mine, {}, table))).toEqual([]);
      const huis = { ...mine, piecieSlots: slotsOf('piecie_huisbaas') };
      expect(planIds(makeState(huis, theirPlace, table))).toEqual(['piecie_huisbaas']);
      expect(planIds(makeState(huis, ownPlace, table))).toEqual([]);
    });
    it('Warm Kannetje Melk and Stripje Bennies only when an own Mosje stays above 0 MP after the loss', () => {
      const warm = slotsOf('piecie_warm_kannetje_melk');
      const strip = slotsOf('piecie_stripje_bennies');
      expect(planIds(makeState({ activeSlots: [jammer(10)], piecieSlots: warm }))).toEqual([]);
      expect(planIds(makeState({ activeSlots: [jammer(20)], piecieSlots: warm }))).toEqual(['piecie_warm_kannetje_melk']);
      expect(planIds(makeState({ activeSlots: [jammer(20)], piecieSlots: strip }))).toEqual([]);
      expect(planIds(makeState({ activeSlots: [jammer(20), jammer(30)], piecieSlots: strip }))).toEqual(['piecie_stripje_bennies']);
    });
  });

  describe('order and holds', () => {
    it('a Power boost comes after quest-prep, and the aggressive profile lifts it before', () => {
      const state = makeState({ piecieSlots: slotsOf('piecie_te_hard_gaan', 'piecie_quest_prep') });
      expect(planIds(state)).toEqual(['piecie_quest_prep', 'piecie_te_hard_gaan']);
      expect(planIds(state, { ...DEFAULT_BOT_PROFILE, preferAttack: true })).toEqual(['piecie_te_hard_gaan', 'piecie_quest_prep']);
    });
    it('power (3) is planned before a Place destroyer (4)', () => {
      const table = { activeSlots: [makeMosje({ cardId: 'mosje_opponent' })] };
      const state = makeState({ piecieSlots: slotsOf('piecie_slecht_gezet', 'piecie_te_hard_gaan') }, { activePlace: 'place_the_gym', activePlacePlayedBy: 'player_1' }, table);
      expect(planIds(state)).toEqual(['piecie_te_hard_gaan', 'piecie_slecht_gezet']);
    });
    it('the old opponentFullyProtected hold is gone: attacks are planned on what the engine allows, not on a flag', () => {
      const state = makeState({ piecieSlots: slotsOf('piecie_affoe') });
      expect(planIds(state, DEFAULT_BOT_PROFILE, { willQuest: true, opponentFullyProtected: true })).toEqual(['piecie_affoe']);
    });
    it('quest-prep Piecies that also gain MP or draw are not held back when no Quest follows', () => {
      const state = makeState({ activeSlots: [jammer(50, { subtype: 'DIGITAL' })], piecieSlots: slotsOf('piecie_controller', 'piecie_skipping_rope', 'piecie_quest_prep') });
      expect(planIds(state, DEFAULT_BOT_PROFILE, { willQuest: false }).sort()).toEqual(['piecie_controller', 'piecie_skipping_rope']);
    });
  });
});

describe('isUsefulActivation', () => {
  it('is true for a card with no special rule', () => {
    expect(isUsefulActivation(makeState(), 'player_2', 'piecie_pot_of_weed')).toBe(true);
    expect(isUsefulActivation(makeState(), 'player_2', 'piecie_not_a_card')).toBe(true);
  });
  it('a Power boost needs an own Mosje that can attack a valid target', () => {
    expect(isUsefulActivation(makeState(), 'player_2', 'piecie_snoeiertje')).toBe(true);
    expect(isUsefulActivation(makeState({ activeSlots: [makeMosje({ sideways: true })] }), 'player_2', 'piecie_snoeiertje')).toBe(false);
    expect(isUsefulActivation(makeState({}, {}, { activeSlots: [null, null] }), 'player_2', 'piecie_snoeiertje')).toBe(false);
  });
  it('is false for a seat that is not on turn (nobody can attack)', () => {
    expect(isUsefulActivation(makeState({}, { activePlayerId: 'player_1' }), 'player_2', 'piecie_snoeiertje')).toBe(false);
  });
});

describe('COMBO_TAGS (61-05)', () => {
  it('every key is a Piecie in src/data/piecies.js', () => {
    const ids = new Set((PIECIES as { id: string }[]).map((p) => p.id));
    expect(Object.keys(COMBO_TAGS).filter((id) => !ids.has(id))).toEqual([]);
  });
  it('tags Power boosts, direct attacks, Place destroyers and self-loss cards by their Card List text', () => {
    for (const id of ['piecie_snoeiertje', 'piecie_te_hard_gaan', 'piecie_super_saiyan_mos', 'piecie_momentum_diefje', 'piecie_continuous_assault', 'piecie_mp_hemorrhage', 'piecie_dikke_taks', 'piecie_boxing_gloves']) {
      expect(getCardTags(id), id).toContain('power');
    }
    expect(getCardTags('piecie_boxing_gloves')).not.toContain('mp-gain');
    for (const id of ['piecie_affoe', 'piecie_kleine_taks', 'piecie_straffoe', 'piecie_harde_didde', 'piecie_klaar_met_jou', 'piecie_stookerino', 'piecie_jantje_jantje', 'piecie_those_eyelashes']) {
      expect(getCardTags(id), id).toContain('attack');
    }
    for (const id of ['piecie_slecht_gezet', 'piecie_popo_komt', 'piecie_huisbaas', 'piecie_bong_hit_demolition']) expect(getCardTags(id), id).toContain('place-destroy');
    for (const id of ['piecie_warm_kannetje_melk', 'piecie_stripje_bennies']) expect(getCardTags(id), id).toEqual(expect.arrayContaining(['self-loss', 'draw']));
    expect(getCardTags('piecie_f1_telemetry')).toEqual(['mp-gain', 'draw']);
    expect(getCardTags('piecie_tikker')).toEqual(['mp-gain']);
    for (const id of ['piecie_quest_prep', 'piecie_loaded_dice', 'piecie_dikke_plaat', 'piecie_controller', 'piecie_skipping_rope', 'piecie_tweede_kans', 'piecie_battle_concert']) {
      expect(getCardTags(id), id).toContain('quest-prep');
    }
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
