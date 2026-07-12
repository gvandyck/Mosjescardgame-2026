/**
 * Tests for U8 — Entry Protection (phase0-rulings.md).
 * A Mosje that just entered play cannot be affected by opponents until its
 * owner's next turn starts. Browser-level repro: tests/ui/entry-protection.spec.js.
 */
import { describe, expect, it } from 'vitest';

// @ts-expect-error JS module without type declarations
import { loseMP } from '../../src/engine/mpManager.js';
// @ts-expect-error JS module without type declarations
import { startTurn, playMosje, useMosjeAbility } from '../../src/engine/turnManager.js';
// @ts-expect-error JS module without type declarations
import { effect_te_hard_gaan, effect_mp_hemorrhage, effect_momentum_diefje } from '../../src/abilities/piecieEffects.js';

interface MosjeSlot {
  cardId: string;
  name: string;
  mp: number;
  level: number;
  isDefeated: boolean;
  abilityUsedThisTurn: boolean;
  immuneThisTurn: boolean;
  mpLostThisTurn: number;
  statusEffects: unknown[];
  traits: Record<string, number>;
  entryProtected?: boolean;
  eliminationStrikeUsed?: boolean;
}

function makeMosje(cardId: string, mp = 50, extra: Partial<MosjeSlot> = {}): MosjeSlot {
  return {
    cardId,
    name: cardId,
    mp,
    level: 0,
    isDefeated: false,
    abilityUsedThisTurn: false,
    immuneThisTurn: false,
    mpLostThisTurn: 0,
    statusEffects: [],
    traits: { physical: 2 },
    ...extra,
  };
}

function makePlayer(activeSlots: (MosjeSlot | null)[], overrides: Record<string, unknown> = {}) {
  return {
    name: 'P',
    hand: [] as { cardId: string; type: string }[],
    deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }, { cardId: 'piecie_kannetje_melk', type: 'PIECIE' }],
    discard: [] as unknown[],
    graveyard: [] as unknown[],
    piecieSlots: [null, null, null, null],
    activeSlots,
    questsCompleted: 0,
    questsCompletedThisTurn: 0,
    questsAttemptedThisTurn: 0,
    hasAttemptedQuestThisTurn: false,
    hasRerolledDieThisTurn: false,
    pieciesPlayedThisTurn: 0,
    pieciesActivatedThisTurn: 0,
    actionsThisTurn: [] as string[],
    lastCardPlayedType: null,
    instantPiecieThisTurn: false,
    chainReactionActive: false,
    abilityDoubleTrigger: false,
    freePiecieActivationAvailable: false,
    skipNextTurn: false,
    questPrepBonus: 0,
    drawsThisTurn: 0,
    totalDamageTaken: 0,
    ...overrides,
  };
}

function makeState(p1Slots: (MosjeSlot | null)[], p2Slots: (MosjeSlot | null)[], activePlayerId = 'player_1') {
  return {
    activePlayerId,
    turnNumber: 3,
    status: 'ACTIVE',
    activePlace: null,
    sharedGeneralQuestDeck: [] as unknown[],
    sharedGeneralQuestDiscard: [] as unknown[],
    _snelleFlags: {},
    players: {
      player_1: makePlayer(p1Slots),
      player_2: makePlayer(p2Slots),
    },
  };
}

// ─────────────────────────────────────────────────────────────
// loseMP central guard
// ─────────────────────────────────────────────────────────────

describe('U8 — loseMP guard', () => {
  it('opponent-inflicted MP loss fizzles against a protected Mosje', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 30)],
      [makeMosje('mosje_gandoe_destroyer', 0, { entryProtected: true })],
      'player_1', // player_1 is acting → loss on player_2's Mosje is hostile
    );
    const after = loseMP(state, 'player_2', 0, 10, 'ABILITY');
    expect(after.players.player_2.activeSlots[0].mp).toBe(0);
    expect(after.players.player_2.activeSlots[0]._pendingDefeat).toBeUndefined();
  });

  it('the same loss applies once protection is gone', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 30)],
      [makeMosje('mosje_gandoe_destroyer', 0)], // no protection
      'player_1',
    );
    const after = loseMP(state, 'player_2', 0, 10, 'ABILITY');
    // 0 MP - 10 → below 0 at Level 0 → pending defeat (defeat-below-0 rule)
    expect(after.players.player_2.activeSlots[0]._pendingDefeat).toBe(true);
  });

  it('own-turn losses (e.g. quest failure) still apply to a protected Mosje', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 50, { entryProtected: true })],
      [makeMosje('mosje_gandoe_destroyer', 50)],
      'player_1', // owner is the active player → self-inflicted risk applies
    );
    const after = loseMP(state, 'player_1', 0, 20, 'QUEST');
    expect(after.players.player_1.activeSlots[0].mp).toBe(30);
  });

  it('cost payments are never blocked, even during the opponent turn (U7)', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 50)],
      [makeMosje('mosje_gandoe_destroyer', 50, { entryProtected: true })],
      'player_1',
    );
    const after = loseMP(state, 'player_2', 0, 20, 'QUEST_COST');
    expect(after.players.player_2.activeSlots[0].mp).toBe(30);
  });
});

// ─────────────────────────────────────────────────────────────
// Lifecycle: set on entry, cleared at owner's startTurn
// ─────────────────────────────────────────────────────────────

describe('U8 — lifecycle', () => {
  it('startTurn clears protection for the active player only', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 30, { entryProtected: true })],
      [makeMosje('mosje_gandoe_destroyer', 0, { entryProtected: true })],
      'player_1',
    );
    const after = startTurn(state);
    expect(after.players.player_1.activeSlots[0].entryProtected).toBeUndefined();
    expect(after.players.player_2.activeSlots[0].entryProtected).toBe(true);
  });

  it('playMosje puts the new Mosje on field WITH entry protection', () => {
    const state = makeState(
      [makeMosje('mosje_gandoe_destroyer', 50), null],
      [makeMosje('mosje_binti', 50)],
      'player_1',
    );
    state.players.player_1.hand = [{ cardId: 'mosje_michelle', type: 'MOSJE' }];
    const result = playMosje(state, 'player_1', { cardId: 'mosje_michelle', type: 'MOSJE' });
    expect(result.success).toBe(true);
    expect(result.state.players.player_1.activeSlots[result.slotIndex].entryProtected).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Hostile effects fizzle whole
// ─────────────────────────────────────────────────────────────

describe('U8 — hostile effects fizzle', () => {
  it('Te Hard Gaan damage fizzles against a protected Mosje', () => {
    const state = makeState(
      [makeMosje('mosje_gandoe_destroyer', 50)],
      [makeMosje('mosje_youri', 50, { entryProtected: true })],
      'player_1',
    );
    const after = effect_te_hard_gaan(state, 'player_1');
    expect(after.players.player_2.activeSlots[0].mp).toBe(50);
  });

  it('MP Hemorrhage debuff fizzles against a protected Mosje', () => {
    const state = makeState(
      [makeMosje('mosje_gandoe_destroyer', 50)],
      [makeMosje('mosje_youri', 50, { entryProtected: true })],
      'player_1',
    );
    const after = effect_mp_hemorrhage(state, 'player_1');
    expect(after.players.player_2.activeSlots[0].statusEffects).toHaveLength(0);
  });

  it('Momentum Diefje steal fizzles WHOLE — no damage taken, no MP gained', () => {
    const state = makeState(
      [makeMosje('mosje_gandoe_destroyer', 50)],
      [makeMosje('mosje_youri', 40, { entryProtected: true })],
      'player_1',
    );
    const after = effect_momentum_diefje(state, 'player_1');
    expect(after.players.player_2.activeSlots[0].mp).toBe(40); // no steal
    expect(after.players.player_1.activeSlots[0].mp).toBe(50); // no gain
  });

  it('Binti Cutting Words is unusable vs a protected target — no discard, no once-per-turn', () => {
    const state = makeState(
      [makeMosje('mosje_binti', 30)],
      [makeMosje('mosje_gandoe_destroyer', 0, { entryProtected: true })],
      'player_1',
    );
    state.players.player_1.hand = [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }];
    (state as any)._pendingTargets = { binti_discard: 'piecie_kannetje_melk' };
    const result = useMosjeAbility(state, 'player_1', 'mosje_binti');
    expect(result.success).toBe(false);
    expect(String(result.error)).toMatch(/protected/i);
    expect(result.state.players.player_1.hand).toHaveLength(1); // nothing discarded
    expect(result.state.players.player_2.activeSlots[0].isDefeated).toBe(false);
  });

  it('Elimination Strike is unusable vs a protected target — the 80 MP is kept', () => {
    const state = makeState(
      [makeMosje('mosje_gandoe_destroyer', 90)],
      [makeMosje('mosje_youri', 20, { entryProtected: true })],
      'player_1',
    );
    const result = useMosjeAbility(state, 'player_1', 'mosje_gandoe_destroyer');
    expect(result.success).toBe(false);
    expect(String(result.error)).toMatch(/protected/i);
    expect(result.state.players.player_1.activeSlots[0].mp).toBe(90); // cost refunded
    expect(result.state.players.player_2.activeSlots[0].isDefeated).toBe(false);
  });
});
