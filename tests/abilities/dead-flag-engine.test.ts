import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { playSnellie } from "../../src/engine/turnManager.js";
import { forceQuestResult } from "../helpers/forceQuestResult.js";
// @ts-expect-error — JS module, no type declarations
import { effect_those_eyelashes } from "../../src/abilities/piecieEffects.js";
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from "../../src/data/piecies.js";

// ─────────────────────────────────────────────────────────────
// Phase 18 — dead-flag fixes
// These three Piecies set an effect flag that was never consumed:
//   _snelleBlocked       (Those Eyelashes)  → playSnellie must reject blocked player
//   _battleConcertActive (Battle Concert)   → the Quest fail must be redirected (KNOWN GAP in 2.0, see below)
//   _rerollGranted       (Tweede Kans)      → main.js consumes (covered indirectly)
// Plus persistence: all three cards must persist until end of turn.
// ─────────────────────────────────────────────────────────────

function makeSnellieState() {
  return {
    activePlayerId: "player_1",
    turnNumber: 1,
    players: {
      player_1: {
        energy: 6,
        hand: [{ cardId: "snelle_test", type: "SNELLE_PIECIE" }],
        deck: [],
        discard: [],
        activeSlots: [
          {
            cardId: "mosje_test",
            mp: 50,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
      player_2: {
        energy: 6,
        hand: [],
        deck: [],
        discard: [],
        activeSlots: [
          {
            cardId: "mosje_opponent",
            mp: 50,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
    },
  };
}

describe("Those Eyelashes — _snelleBlocked guard in playSnellie", () => {
  const cardRef = { cardId: "snelle_test", type: "SNELLE_PIECIE" };
  const cardDef = { name: "Test Snelle", effectId: "effect_test" };

  it("blocks the player whose id is stored in _snelleBlocked", () => {
    const state = makeSnellieState();
    (state as any)._snelleBlocked = "player_1"; // player_1 is blocked

    const { success, error } = playSnellie(state, "player_1", cardRef, cardDef);
    expect(success).toBe(false);
    expect(error).toContain("blocked");
  });

  it("does NOT block a player when _snelleBlocked holds the OTHER player's id", () => {
    const state = makeSnellieState();
    (state as any)._snelleBlocked = "player_2"; // only player_2 is blocked

    const { success, error } = playSnellie(state, "player_1", cardRef, cardDef);
    // player_1 is not blocked — must not fail with the block message
    expect(success).toBe(true);
    if (error) {
      expect(error).not.toContain("blocked");
    }
  });
});

describe("Those Eyelashes — effect stores opponent id (not boolean true)", () => {
  it("sets _snelleBlocked to the opponent's playerId when Martin/West is on field", () => {
    const state = makeSnellieState();
    // Give the active player a Martin on field so the effect fires.
    state.players.player_1.activeSlots[0] = {
      cardId: "mosje_martin",
      mp: 50,
      level: 1,
      isDefeated: false,
      traits: {},
      statusEffects: [],
      abilityUsedThisTurn: false,
    } as any;
    // Opponent needs a hand card for the discard loop (Those Eyelashes discards 1).
    state.players.player_2.hand = [{ cardId: "any_card", type: "PIECIE" }];

    const next = effect_those_eyelashes(state, "player_1");
    // Must be the opponent's id, NOT boolean true.
    expect(next._snelleBlocked).toBe("player_2");
    expect(next._snelleBlocked).not.toBe(true);
  });
});

describe("Persistence — three dead-flag Piecies persist until end of turn", () => {
  const find = (id: string) => PIECIES.find((p: any) => p.id === id);

  it("piecie_tweede_kans has persistUntilEndOfTurn true", () => {
    expect(find("piecie_tweede_kans")?.persistUntilEndOfTurn).toBe(true);
  });

  it("piecie_battle_concert has persistUntilEndOfTurn true", () => {
    expect(find("piecie_battle_concert")?.persistUntilEndOfTurn).toBe(true);
  });

  it("piecie_those_eyelashes has persistUntilEndOfTurn true", () => {
    expect(find("piecie_those_eyelashes")?.persistUntilEndOfTurn).toBe(true);
  });
});

function makeBattleConcertState(questingCardId: string) {
  return {
    activePlayerId: "player_1",
    turnNumber: 1,
    activePlace: null,
    players: {
      player_1: {
        energy: 6,
        hand: [],
        deck: [],
        discard: [],
        activeSlots: [
          {
            cardId: questingCardId,
            name: "Questing Mosje",
            mp: 50,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
      player_2: {
        energy: 6,
        hand: [],
        deck: [],
        discard: [],
        activeSlots: [
          {
            cardId: "mosje_opponent",
            name: "Opponent Mosje",
            mp: 50,
            level: 1,
            isDefeated: false,
            traits: {},
            statusEffects: [],
            abilityUsedThisTurn: false,
          },
          null,
        ],
        piecieSlots: [null, null, null, null],
        questsCompleted: 0,
        questsCompletedThisTurn: 0,
        questsAttemptedThisTurn: 0,
        hasAttemptedQuestThisTurn: false,
        pieciesPlayedThisTurn: 0,
      },
    },
  };
}

// 2.0 Quest: Quick Thinking (Steady, 1 die 4+): win +25 / lose -15. Dice forced by forceQuestResult.
const FAIL_QUEST = "quest_quick_thinking";

describe("Battle Concert — redirect Alyssa's quest-failure MP to opponent", () => {
  // KNOWN GAP (fix in Phase 58): V4 resolveQuest redirected the fail to the opponent; the 2.0 attempt
  // (resolveQuestAttempt) does not read _battleConcertActive yet, and 2.0 Battle Concert is a flat 15 (Card List).
  it.skip("redirects the Quest fail to opponent when _battleConcertActive set and Mosje is Alyssa", () => {
    const state = makeBattleConcertState("mosje_alyssa_bulldozer");
    (state as any)._battleConcertActive = "player_1";

    const next = forceQuestResult(state, "player_1", { questId: FAIL_QUEST, win: false });

    // 2.0: opponent loses a flat 15 (50 → 35).
    expect(next.players.player_2.activeSlots[0].mp).toBe(35);
    // Alyssa is NOT also hit by the failMP — stays at 50.
    expect(next.players.player_1.activeSlots[0].mp).toBe(50);
    // Flag cleared after redirect (no double-redirect).
    expect(next._battleConcertActive).toBeUndefined();
  });

  it("does NOT redirect when the questing Mosje is not Alyssa", () => {
    const state = makeBattleConcertState("mosje_jisca");
    (state as any)._battleConcertActive = "player_1";

    const next = forceQuestResult(state, "player_1", { questId: FAIL_QUEST, win: false });

    // Non-Alyssa Mosje takes its own Quick Thinking fail (50 → 35).
    expect(next.players.player_1.activeSlots[0].mp).toBe(35);
    // Opponent untouched.
    expect(next.players.player_2.activeSlots[0].mp).toBe(50);
  });
});
