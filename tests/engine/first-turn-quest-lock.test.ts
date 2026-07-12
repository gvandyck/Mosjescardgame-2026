import { describe, expect, it } from "vitest";
// @ts-expect-error — JS module, no type declarations
import { canAttemptGeneralQuest, getGeneralQuestBlockReason } from "../../src/abilities/questLogic.js";
// @ts-expect-error — JS module, no type declarations
import { createInitialGameState } from "../../src/engine/gameState.js";

/**
 * First-seat tempo fix (2026-07-12): General Quests have no "wait a turn"
 * delay (unlike Piecies/Places/Personal Quests, U2), so the game's literal
 * first player could attempt one before their opponent had any turn at
 * all. Deliberately ASYMMETRIC — only the game's first player is
 * restricted on turnNumber===1; the second player's own opening turn
 * (also turnNumber===1, since turnNumber is a round counter that only
 * increments when play wraps back to the first player) is unrestricted.
 * A symmetric "no quest on your own first turn" rule would narrow nothing
 * — it shifts both players' quest-eligibility by one turn each and
 * preserves the exact same relative gap between them.
 */

const QUEST = {
  id: "quest_arm_wrestling",
  requirementId: "quest_req_arm_wrestling",
  successMP: 60,
  failMP: -20,
};

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    turnNumber: 1,
    firstPlayerId: "player_1",
    players: {
      player_1: {
        activeSlots: [
          { cardId: "mosje_gandoe_destroyer", name: "Gandoe", mp: 50, level: 0, isDefeated: false, traits: {}, statusEffects: [] },
          null,
        ],
      },
      player_2: {
        activeSlots: [
          { cardId: "mosje_michelle", name: "Michelle", mp: 50, level: 0, isDefeated: false, traits: {}, statusEffects: [] },
          null,
        ],
      },
    },
    ...overrides,
  };
}

describe("First-seat tempo fix — canAttemptGeneralQuest turn-1 lock", () => {
  it("blocks the game's first player from attempting a General Quest on turn 1", () => {
    const state = makeState();
    expect(canAttemptGeneralQuest(QUEST, state, "player_1")).toBe(false);
  });

  it("does NOT block the second player on their own opening turn (still turnNumber===1)", () => {
    const state = makeState({ activePlayerId: "player_2" });
    expect(canAttemptGeneralQuest(QUEST, state, "player_2")).toBe(true);
  });

  it("no longer blocks the first player once turnNumber advances past 1", () => {
    const state = makeState({ turnNumber: 2 });
    expect(canAttemptGeneralQuest(QUEST, state, "player_1")).toBe(true);
  });

  it("still applies every other canAttemptGeneralQuest check on turn 2+ (not a blanket bypass)", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots[0].mp = -5;
    expect(canAttemptGeneralQuest(QUEST, state, "player_1")).toBe(false);
  });

  it("backward-compatible: a state with no turnNumber/firstPlayerId fields is never blocked by this rule", () => {
    // Matches the shape used by existing quest tests written before this fix
    // (e.g. momentum-master.test.ts) — undefined !== 1, so the new guard
    // never fires for state objects that don't carry these fields.
    const state = {
      players: {
        player_1: {
          activeSlots: [
            { cardId: "mosje_gandoe_destroyer", name: "Gandoe", mp: 50, level: 0, isDefeated: false, traits: {}, statusEffects: [] },
            null,
          ],
        },
      },
    };
    expect(canAttemptGeneralQuest(QUEST, state, "player_1")).toBe(true);
  });
});

describe("createInitialGameState — firstPlayerId", () => {
  it("captures whichever player config is listed first, distinct from activePlayerId drifting later", () => {
    const state = createInitialGameState(
      [
        { playerId: "player_1", name: "Alice", deckId: "DUO_WEST_CLESS" },
        { playerId: "player_2", name: "Bob", deckId: "DUO_GANDOE_MICHELLE" },
      ],
      "TEST_ROOM"
    );
    expect(state.firstPlayerId).toBe("player_1");
    expect(state.activePlayerId).toBe("player_1");
  });

  it("respects a non-default starting player order (e.g. dice-roll winner listed first)", () => {
    const state = createInitialGameState(
      [
        { playerId: "player_2", name: "Bob", deckId: "DUO_GANDOE_MICHELLE" },
        { playerId: "player_1", name: "Alice", deckId: "DUO_WEST_CLESS" },
      ],
      "TEST_ROOM"
    );
    expect(state.firstPlayerId).toBe("player_2");
  });
});

/**
 * getGeneralQuestBlockReason — specific reason strings, one per
 * canAttemptGeneralQuest branch. Added 2026-07-12 after "requirement-not-met"
 * turned out to be a single bucket hiding 5 different causes (first-turn
 * lock, no active Mosje, QUEST_BLOCKED status, negative MP, Momentum Master
 * range) — the deck-matrix report couldn't tell them apart. Each branch
 * below matches an exact reason string canAttemptGeneralQuest now delegates
 * to; keep these in sync if a new precondition is ever added to that
 * function.
 */
describe("getGeneralQuestBlockReason — specific reasons behind requirement-not-met", () => {
  const MOMENTUM_QUEST = { id: "quest_momentum_master", requirementId: "quest_req_momentum_master", successMP: 60, failMP: -40 };

  it("'first-turn-lock' — the game's first player on turn 1", () => {
    const state = makeState();
    expect(getGeneralQuestBlockReason(QUEST, state, "player_1")).toBe("first-turn-lock");
  });

  it("null (attemptable) — second player on their own opening turn", () => {
    const state = makeState({ activePlayerId: "player_2" });
    expect(getGeneralQuestBlockReason(QUEST, state, "player_2")).toBeNull();
  });

  it("'no-active-mosje' — every Mosje slot empty or defeated", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots = [null, null];
    expect(getGeneralQuestBlockReason(QUEST, state, "player_1")).toBe("no-active-mosje");
  });

  it("'quest-blocked-status' — Tikker's QUEST_BLOCKED status effect", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots[0].statusEffects = [{ type: "QUEST_BLOCKED" }];
    expect(getGeneralQuestBlockReason(QUEST, state, "player_1")).toBe("quest-blocked-status");
  });

  it("'negative-mp' — active Mosje's MP dropped below 0 (from a cost payment)", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots[0].mp = -5;
    expect(getGeneralQuestBlockReason(QUEST, state, "player_1")).toBe("negative-mp");
  });

  it("'momentum-master-range' — Momentum Master outside the 80-100 MP window", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots[0].mp = 50;
    expect(getGeneralQuestBlockReason(MOMENTUM_QUEST, state, "player_1")).toBe("momentum-master-range");
  });

  it("null (attemptable) — Momentum Master WITHIN the 80-100 MP window", () => {
    const state = makeState({ turnNumber: 2 });
    state.players.player_1.activeSlots[0].mp = 90;
    expect(getGeneralQuestBlockReason(MOMENTUM_QUEST, state, "player_1")).toBeNull();
  });

  it("canAttemptGeneralQuest stays a thin boolean wrapper over the same checks", () => {
    const blocked = makeState();
    const clear = makeState({ turnNumber: 2 });
    expect(canAttemptGeneralQuest(QUEST, blocked, "player_1")).toBe(false);
    expect(canAttemptGeneralQuest(QUEST, clear, "player_1")).toBe(true);
  });
});
