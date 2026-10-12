/**
 * Tests for src/bot/botDriver.js
 *
 * NOTE: Test file uses .ts extension (vitest.config.js only picks up tests/**\/*.ts).
 * The source file remains .js as specified by the plan.
 */
import { describe, expect, it } from 'vitest';

// @ts-expect-error JS module without type declarations
import { driveBotTurn, driveBotTurnSteps } from '../../src/bot/botDriver.js';
// @ts-expect-error JS module without type declarations
import { getPartnerSynergyQuestBonus } from '../../src/abilities/questLogic.js';
import { PIECIES } from '../../src/data/piecies.js';
import { PLACES } from '../../src/data/places.js';
import { MOSJES } from '../../src/data/mosjes.js';

// ─────────────────────────────────────────────────────────────
// Minimal game state factory for bot tests
// Builds a state object matching the shape botDriver.js reads.
// Do NOT use createInitialGameState — it has side effects.
// ─────────────────────────────────────────────────────────────

interface PiecieSlot {
  cardId: string;
  type: string;
  faceDown: boolean;
  activated: boolean;
  playedOnTurn: number;
  canActivateOnTurn: number;
  persistUntilEoT?: boolean;
}

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
  subtype?: string;
}

interface HandCard {
  cardId: string;
  type: string;
}

interface MakeStateOptions {
  hand?: HandCard[];
  piecieSlots?: (PiecieSlot | null)[];
  activeSlots?: MosjeSlot[];
  questDeck?: HandCard[];
  opponentSlots?: (MosjeSlot | null)[];
}

function makeMosjeSlot(cardId: string, mp = 50): MosjeSlot {
  const def = (MOSJES as { id: string; name: string; traits?: Record<string, number>; subtype?: string }[]).find(
    (m) => m.id === cardId
  );
  return {
    cardId,
    name: def?.name ?? cardId,
    mp,
    level: 1,
    isDefeated: false,
    abilityUsedThisTurn: false,
    immuneThisTurn: false,
    mpLostThisTurn: 0,
    statusEffects: [],
    traits: { ...(def?.traits ?? {}) },
    subtype: def?.subtype,
  };
}

function makeState({
  hand = [],
  piecieSlots = [null, null, null, null],
  activeSlots = [],
  questDeck = [],
  opponentSlots,
}: MakeStateOptions = {}) {
  return {
    activePlayerId: 'player_2',
    turnNumber: 5,
    // 2.0: three typed Quest stacks. `questDeck[0]` (if any) is the face-up Quest of FIGHTING.
    questStacks: {
      FIGHTING: { deck: [] as string[], faceUp: questDeck[0]?.cardId ?? null, tokens: 0, discard: [] as string[] },
      DIGITAL: { deck: [] as string[], faceUp: null, tokens: 0, discard: [] as string[] },
      ARTISTIC: { deck: [] as string[], faceUp: null, tokens: 0, discard: [] as string[] },
    },
    activePlace: null,
    activePlacePlayedBy: null,
    activePlaceTurnsActive: 0,
    status: 'ACTIVE',
    _snelleFlags: {},
    players: {
      player_1: {
        energy: 6,
        hand: [] as HandCard[],
        piecieSlots: [null, null, null, null] as (PiecieSlot | null)[],
        activeSlots: opponentSlots ?? [makeMosjeSlot('mosje_jeffrey', 50)],
        deck: [] as HandCard[],
        discard: [] as string[],
        questsAttemptedThisTurn: 0,
        questsCompletedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
        pieciesActivatedThisTurn: 0,
        actionsThisTurn: [] as string[],
        freePiecieActivationAvailable: false,
        cooldownTurn: false,
        questPrepBonus: 0,
        drawsThisTurn: 0,
        totalDamageTaken: 0,
        questsCompleted: 0,
        lastCardPlayedType: null,
        instantPiecieThisTurn: false,
        chainReactionActive: false,
        abilityDoubleTrigger: false,
        hasRerolledDieThisTurn: false,
      },
      player_2: {
        energy: 6,
        hand,
        piecieSlots,
        activeSlots,
        deck: [] as HandCard[],
        discard: [] as string[],
        questsAttemptedThisTurn: 0,
        questsCompletedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
        pieciesActivatedThisTurn: 0,
        actionsThisTurn: [] as string[],
        freePiecieActivationAvailable: false,
        cooldownTurn: false,
        questPrepBonus: 0,
        drawsThisTurn: 0,
        totalDamageTaken: 0,
        questsCompleted: 0,
        lastCardPlayedType: null,
        instantPiecieThisTurn: false,
        chainReactionActive: false,
        abilityDoubleTrigger: false,
        hasRerolledDieThisTurn: false,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

const QUEST_ID = 'quest_tough_it_out'; // steady, FIGHTING, resilient, no cost

describe('driveBotTurn', () => {
  // Test 1: No-op game — driveBotTurn does not throw, returns a state
  it('no-op game (empty hand, no activatable slots) — does not throw and returns state', () => {
    const state = makeState({
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
    });
    expect(() => driveBotTurn(state, 'player_2')).not.toThrow();
    const result = driveBotTurn(state, 'player_2');
    expect(result).toBeDefined();
    expect(result.players).toBeDefined();
  });

  // Test 2: Hand has one PIECIE, slot available — after driveBotTurn hand.length decreases by 1
  it('hand has one PIECIE, slot available — hand.length decreases by 1', () => {
    const piecieId = (PIECIES as { id: string }[])[0].id; // piecie_kannetje_melk
    const state = makeState({
      hand: [{ cardId: piecieId, type: 'PIECIE' }],
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
    });
    const result = driveBotTurn(state, 'player_2');
    // Card should have been removed from hand (played face-down)
    const handAfter = result.players.player_2.hand as HandCard[];
    expect(handAfter.length).toBeLessThan(1);
  });

  // Test 3: piecieSlots has a PIECIE with canActivateOnTurn <= turnNumber — slot gets activated=true
  // Using piecie_te_hard_gaan (ATTACK tag) with mosje_gandoe_wizard to avoid Jeffrey's FOOD/RESTORE block
  it('piecieSlots has activatable PIECIE — slot becomes activated', () => {
    const piecieId = 'piecie_te_hard_gaan'; // ATTACK tag — not blocked by Jeffrey, but use Gandoe anyway
    const slot: PiecieSlot = {
      cardId: piecieId,
      type: 'PIECIE',
      faceDown: true,
      activated: false,
      playedOnTurn: 4,
      canActivateOnTurn: 5, // turnNumber is 5, so this is activatable
    };
    const state = makeState({
      piecieSlots: [slot, null, null, null],
      activeSlots: [makeMosjeSlot('mosje_gandoe_wizard', 50)],
    });
    const result = driveBotTurn(state, 'player_2');
    // The slot should no longer be face-down/unactivated (may be null after activation sweep or activated=true)
    const slotsAfter = result.players.player_2.piecieSlots as (PiecieSlot | null)[];
    // Either the slot was activated (activated=true) or swept to discard (null)
    const slotAfter = slotsAfter[0];
    if (slotAfter !== null) {
      expect(slotAfter.activated).toBe(true);
    } else {
      // Piecie was activated and swept to discard — still correct
      expect(slotAfter).toBeNull();
    }
  });

  // Test 4: a face-up Quest and no attack target - the bot Quests (one action) and the attempt is counted
  it('face-up Quest, no attack target, Mosje with mp=50 - questsAttemptedThisTurn increments', () => {
    const state = makeState({
      questDeck: [{ cardId: QUEST_ID, type: 'QUEST' }],
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
      opponentSlots: [null, null],
    });
    const beforeAttempts = state.players.player_2.questsAttemptedThisTurn;
    const result = driveBotTurn(state, 'player_2');
    const afterAttempts = result.players.player_2.questsAttemptedThisTurn as number;
    expect(afterAttempts).toBeGreaterThan(beforeAttempts);
    expect((result.players.player_2.activeSlots as any[])[0].actedThisTurn).toBe(true);
  });

  // Test 5: hand has one PLACE, slot available — piecieSlots contains a PLACE type entry (face-down)
  it('hand has one PLACE, slot available — piecieSlots has a PLACE entry', () => {
    const placeId = (PLACES as { id: string }[])[0].id; // place_the_gym
    const state = makeState({
      hand: [{ cardId: placeId, type: 'PLACE' }],
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
    });
    const result = driveBotTurn(state, 'player_2');
    const slotsAfter = result.players.player_2.piecieSlots as (PiecieSlot | null)[];
    const placedSlot = slotsAfter.find((s) => s?.type === 'PLACE');
    expect(placedSlot).toBeDefined();
    expect(placedSlot?.cardId).toBe(placeId);
  });

  // Test 6: Input state is not mutated
  it('input state is not mutated (deep clone check)', () => {
    const piecieId = (PIECIES as { id: string }[])[0].id;
    const state = makeState({
      hand: [{ cardId: piecieId, type: 'PIECIE' }],
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
    });
    const originalHandLength = state.players.player_2.hand.length;
    const originalHandSnapshot = JSON.stringify(state.players.player_2.hand);
    driveBotTurn(state, 'player_2');
    // Original state must be unchanged
    expect(state.players.player_2.hand.length).toBe(originalHandLength);
    expect(JSON.stringify(state.players.player_2.hand)).toBe(originalHandSnapshot);
  });

  // Test 7: Returned state.activePlayerId is not botPlayerId (endTurn was called)
  it('returned state.activePlayerId is not player_2 (endTurn was called)', () => {
    const state = makeState({
      activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)],
    });
    const result = driveBotTurn(state, 'player_2');
    expect(result.activePlayerId).not.toBe('player_2');
  });

  // Test 8: Real data — driveBotTurn does not crash on state seeded with actual PIECIE
  it('real data smoke test — does not crash on actual PIECIE from PIECIES array', () => {
    // Use a real piecie_kannetje_melk (MOMENTUM-GAINING, no level requirement)
    const piecieId = (PIECIES as { id: string; requirement?: string }[]).find(
      (p) => p.requirement === 'any'
    )!.id;
    const state = makeState({
      hand: [{ cardId: piecieId, type: 'PIECIE' }],
      activeSlots: [makeMosjeSlot('mosje_gandoe_wizard', 50)],
    });
    expect(() => driveBotTurn(state, 'player_2')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────
// Bot Quest-or-nothing by expected MP swing (2.0, 56-05)
// tough_it_out: steady band, +25 / -15. A fail that reaches 0 MP is getemt.
// ─────────────────────────────────────────────────────────────

describe('driveBotTurn - Quest risk (2.0, 56-05)', () => {
  const quest = (mp: number) => makeState({
    questDeck: [{ cardId: QUEST_ID, type: 'QUEST' }],
    activeSlots: [makeMosjeSlot('mosje_jeffrey', mp)],
    opponentSlots: [null, null],
  });
  const slotAfter = (st: any) => (st.players.player_2.activeSlots as any[])[0];

  // WHY changed (was: V4 'skips below 2x failMP', later 'attempts at 10 MP'): the 2.0 bot weighs
  // getemt. At 10 or 15 MP the -15 fail reaches 0 (getemt), so the swing is negative and it holds back.
  it('mp=10: a fail would getemt it, so the bot does not Quest', () => {
    const after = slotAfter(driveBotTurn(quest(10), 'player_2'));
    expect(after.mp).toBe(10);
    expect(after.actedThisTurn).not.toBe(true);
    expect(after.isDefeated).toBe(false);
  });

  it('mp=15: failing lands exactly on 0 (getemt), so the bot does not Quest', () => {
    expect(slotAfter(driveBotTurn(quest(15), 'player_2')).mp).toBe(15);
  });

  it('mp=40 and mp=50: safe to try - the Quest is attempted (MP moves)', () => {
    expect(slotAfter(driveBotTurn(quest(40), 'player_2')).mp).not.toBe(40);
    expect(slotAfter(driveBotTurn(quest(50), 'player_2')).mp).not.toBe(50);
  });
});

describe('driveBotTurn - attacks (2.0, 56-05)', () => {
  it('attacks a non-fresh opponent Mosje (target loses MP, attacker acted once)', () => {
    const state: any = makeState({ activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)] });
    state.players.player_1.activeSlots = [{ ...makeMosjeSlot('mosje_gandoe_wizard', 80), entryProtected: false }];
    state.players.player_2.activeSlots[0].entryProtected = false;
    const result = driveBotTurn(state, 'player_2');
    expect(driveBotTurnSteps(state, 'player_2').filter((st: any) => /attacks/.test(st.label))).toHaveLength(1);
    expect(result.players.player_1.activeSlots[0].mp).toBeLessThan(80);
  });

  it('never attacks a fresh opponent Mosje', () => {
    const state: any = makeState({ activeSlots: [makeMosjeSlot('mosje_jeffrey', 50)] });
    state.players.player_1.activeSlots = [{ ...makeMosjeSlot('mosje_gandoe_wizard', 80), entryProtected: true }];
    const result = driveBotTurn(state, 'player_2');
    expect(result.players.player_1.activeSlots[0].mp).toBe(80);
  });
});

// ─────────────────────────────────────────────────────────────
// AZN Cless — Risk and Reward gating
// The ability is a manual, zero-cost, fixed 50/50 gamble (even d6 → +25 MP,
// odd → -15 MP). It has no MP-cost gate to fall back on, so the bot must
// reason about the DOWNSIDE severity itself (classifyLossSeverity /
// getRequiredConfidence in strategy/assessQuestRisk.js) rather than firing
// blind every turn.
// ─────────────────────────────────────────────────────────────

describe('driveBotTurn — AZN Cless Risk and Reward gating', () => {
  it('gambles when the -15 MP outcome is merely "safe" (plenty of MP)', () => {
    const state = makeState({
      activeSlots: [makeMosjeSlot('mosje_azn_cless', 60)],
    });
    const result = driveBotTurn(state, 'player_2');
    const mosjeAfter = (result.players.player_2.activeSlots as MosjeSlot[])[0];
    // Fixed 50/50 outcome: either +25 (85) or -15 (45) — either way it moved.
    expect([85, 45]).toContain(mosjeAfter.mp);
    expect(mosjeAfter.abilityUsedThisTurn).toBe(true);
  });

  it('skips the gamble when it would be FATAL — Level 0, no backup Mosje, low MP', () => {
    const state = makeState({
      activeSlots: [makeMosjeSlot('mosje_azn_cless', 10)], // 10 - 15 < 0, Level 0, alone
    });
    const result = driveBotTurn(state, 'player_2');
    const mosjeAfter = (result.players.player_2.activeSlots as MosjeSlot[])[0];
    // No other card/quest in this minimal state can touch MP, so unchanged
    // MP proves the ability was never invoked — the gate held.
    expect(mosjeAfter.mp).toBe(10);
    expect(mosjeAfter.abilityUsedThisTurn).toBe(false);
  });

  it('skips the gamble at "regress" severity too — even 0.55 required beats the fixed 50% odds', () => {
    // Level 1 with low MP: 10 - 15 < 0, but a level to lose means this is
    // 'regress' (not 'defeat'/'fatal') regardless of a backup Mosje existing.
    // REQUIRED_P.regress (0.55) still exceeds the ability's fixed 0.5 odds at
    // a neutral risk profile, so the gate should hold here too — proving the
    // gate is genuinely severity-graduated, not just a defeat/no-defeat check.
    const state = makeState({
      activeSlots: [{ ...makeMosjeSlot('mosje_azn_cless', 10), level: 2 }],
    });
    const result = driveBotTurn(state, 'player_2');
    const clessAfter = (result.players.player_2.activeSlots as MosjeSlot[])[0];
    expect(clessAfter.mp).toBe(10);
    expect(clessAfter.abilityUsedThisTurn).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Plays a 2nd Mosje from hand
// Previously botDriver.js had NO playMosje call anywhere — the bot only
// ever fielded its single starting Mosje for the whole game, so any "both
// Mosjes active" synergy (West+Cless, GM's Kickboxing bonus) could never
// trigger in bot-vs-bot play regardless of being correctly implemented.
// ─────────────────────────────────────────────────────────────

describe('driveBotTurn — plays a 2nd Mosje from hand', () => {
  it('plays a MOSJE hand card into a free field slot', () => {
    const state = makeState({
      hand: [{ cardId: 'mosje_azn_cless', type: 'MOSJE' }],
      activeSlots: [makeMosjeSlot('mosje_martin_senor_west', 50), null as unknown as MosjeSlot],
    });
    const result = driveBotTurn(state, 'player_2');

    const hand = result.players.player_2.hand as HandCard[];
    expect(hand.find((c) => c.cardId === 'mosje_azn_cless')).toBeUndefined();

    const slots = result.players.player_2.activeSlots as MosjeSlot[];
    const played = slots.find((s) => s?.cardId === 'mosje_azn_cless');
    expect(played).toBeDefined();
    expect(played?.isDefeated).toBe(false);
  });

  it('does not play it when both field slots are already full', () => {
    const state = makeState({
      hand: [{ cardId: 'mosje_azn_cless', type: 'MOSJE' }],
      activeSlots: [
        makeMosjeSlot('mosje_martin_senor_west', 50),
        makeMosjeSlot('mosje_jeffrey', 50),
      ],
    });
    const result = driveBotTurn(state, 'player_2');

    const hand = result.players.player_2.hand as HandCard[];
    expect(hand.find((c) => c.cardId === 'mosje_azn_cless')).toBeDefined(); // still in hand
  });

  it('closes the loop: playing the 2nd Mosje makes the partner-synergy bonus detectable', () => {
    // Direct proof the two fixes now connect — no dice-roll control needed:
    // once driveBotTurn has actually placed Cless next to West, the live
    // board-state synergy check (questLogic.js) must see BOTH of them.
    const state = makeState({
      hand: [{ cardId: 'mosje_azn_cless', type: 'MOSJE' }],
      activeSlots: [makeMosjeSlot('mosje_martin_senor_west', 50), null as unknown as MosjeSlot],
    });
    const result = driveBotTurn(state, 'player_2');
    const bonus = getPartnerSynergyQuestBonus(result, 'player_2', 'Physical');
    expect(bonus).toBe(15);
  });
});

describe('driveBotTurn — sideways Mosje takes no action (2.0, 54-11)', () => {
  it('never picks a sideways Mosje for a Quest', () => {
    const sideways = { ...makeMosjeSlot('mosje_jeffrey', 80), sideways: true } as any;
    const state = makeState({
      questDeck: [{ cardId: QUEST_ID, type: 'QUEST' }],
      activeSlots: [sideways],
    });
    const result = driveBotTurn(state, 'player_2');
    const after = (result.players.player_2.activeSlots as MosjeSlot[])[0];
    expect(after.mp).toBe(80);
  });
});

describe('driveBotTurn - summon cost and cooldown (2.0, 55-03)', () => {
  it('summons nothing when Energy is below every hand Mosje cost', () => {
    const state: any = makeState({
      hand: [{ cardId: 'mosje_azn_cless', type: 'MOSJE' }],
      activeSlots: [makeMosjeSlot('mosje_martin_senor_west', 50), null as unknown as MosjeSlot],
    });
    state.players.player_2.energy = 0;
    const result = driveBotTurn(state, 'player_2');
    expect((result.players.player_2.hand as HandCard[]).some((c) => c.cardId === 'mosje_azn_cless')).toBe(true);
    expect((result.players.player_2.activeSlots as any[])[1]).toBeNull();
  });

  it('on a cooldown turn the bot only places Piecies (no summon, no activation, no Quest)', () => {
    const state: any = makeState({
      hand: [
        { cardId: 'mosje_azn_cless', type: 'MOSJE' },
        { cardId: 'piecie_kannetje_melk', type: 'PIECIE' },
      ],
      activeSlots: [makeMosjeSlot('mosje_martin_senor_west', 50), null as unknown as MosjeSlot],
      questDeck: [{ cardId: QUEST_ID, type: 'QUEST' }],
    });
    state.players.player_2.cooldownTurn = true;
    const result = driveBotTurn(state, 'player_2');
    const p2 = result.players.player_2;
    expect((p2.activeSlots as any[])[1]).toBeNull();
    expect(p2.questsAttemptedThisTurn).toBe(0);
    expect((p2.piecieSlots as any[]).some((s) => s?.cardId === 'piecie_kannetje_melk')).toBe(true);
    expect(result.activePlayerId).toBe('player_1');
  });
});
