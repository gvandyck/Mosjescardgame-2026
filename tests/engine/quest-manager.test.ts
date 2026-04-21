import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { attemptQuest, NonQuestCardError, QuestInvocation } from "../../src/engine/quest-manager.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import { deepFreeze } from "../../src/utils/freeze.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";
import type { QuestDefinition } from "../../src/cards/schema/quest-definition.js";

function id(s: string): CardId {
  return s as CardId;
}

const QUEST_ID = id("quest_test_general");
const PERSONAL_QUEST_ID = id("quest_test_personal");
const NOT_QUEST_ID = id("fake_piecie");

const generalQuest: QuestDefinition = {
  id: QUEST_ID,
  name: "Test Quest",
  category: "quest",
  scope: "general",
  requirements: [],
  roll: {
    die: "d6",
    thresholds: { "1": 3, "2": 2, "3": 1 },
  },
  onSuccess: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 } }],
  onFailure: [],
};

const personalQuest: QuestDefinition = {
  id: PERSONAL_QUEST_ID,
  name: "Personal Quest",
  category: "quest",
  scope: "personal",
  requiredMosjeCardId: id("mosje_required"),
  requirements: [],
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 3, "3": 2 },
  },
  onSuccess: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 30 } }],
  onFailure: [],
};

const notAQuest = {
  id: NOT_QUEST_ID,
  name: "Fake Piecie",
  category: "piecie" as const,
  requirements: [],
};

function baseState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: id("mosje_a"), level: 1, mp: 50, flags: {} },
          { instanceId: "m2", cardId: id("mosje_b"), level: 1, mp: 10, flags: {} },
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 },
        ],
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: { quests_completed_total: 0 },
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: id("mosje_c"), level: 1, mp: 40, flags: {} },
          { instanceId: "m4", cardId: id("mosje_d"), level: 1, mp: 30, flags: {} },
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 },
        ],
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: { quests_completed_total: 0 },
      },
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 42,
  };
}

const p1MosjeRef = { playerId: "p1", instanceId: "m1" };

beforeEach(() => {
  clearRegistry();
  registerCard(generalQuest);
  registerCard(personalQuest);
  registerCard(notAQuest as any);
});

afterEach(() => {
  clearRegistry();
});

describe("attemptQuest", () => {
  it("throws NonQuestCardError when card category is not quest", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
    };
    expect(() => attemptQuest(state, NOT_QUEST_ID, invocation)).toThrow(NonQuestCardError);
  });

  it("emits quest_rejected when personal quest is attempted by wrong mosje", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef, // mosje_a, not mosje_required
    };
    const next = attemptQuest(state, PERSONAL_QUEST_ID, invocation);
    const last = next.eventLog[next.eventLog.length - 1];
    expect(last.type).toBe("quest_rejected");
    if (last.type === "quest_rejected") {
      expect(last.questId).toBe(PERSONAL_QUEST_ID);
    }
  });

  it("emits quest_skipped when mosje has quest_locked buff", () => {
    const state: GameState = {
      ...baseState(),
      players: baseState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1" ? m : { ...m, flags: { quest_locked: true } }
              ),
            }
      ),
    };
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 6,
    };
    const next = attemptQuest(deepFreeze(state), QUEST_ID, invocation);
    const last = next.eventLog[next.eventLog.length - 1];
    expect(last.type).toBe("quest_skipped");
  });

  it("emits quest_completed on successful roll and applies onSuccess effects", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 6, // always beats threshold 3 for 1-star
    };
    const next = attemptQuest(state, QUEST_ID, invocation);
    const completedEvent = next.eventLog.find((e) => e.type === "quest_completed");
    expect(completedEvent).toBeDefined();

    // onSuccess grants 20 MP to m1
    const p1 = next.players.find((p) => p.id === "p1")!;
    const m1 = p1.mosjes.find((m) => m.instanceId === "m1")!;
    expect(m1.mp).toBeGreaterThan(50);
  });

  it("increments quests_completed_total on success", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 6,
    };
    const next = attemptQuest(state, QUEST_ID, invocation);
    const p1 = next.players.find((p) => p.id === "p1")!;
    expect(p1.flags.quests_completed_total).toBe(1);
  });

  it("emits quest_failed when roll is below threshold", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 1, // threshold for 1-star is 3, so 1 fails
    };
    const next = attemptQuest(state, QUEST_ID, invocation);
    const failedEvent = next.eventLog.find((e) => e.type === "quest_failed");
    expect(failedEvent).toBeDefined();
  });

  it("does not increment quests_completed_total on failure", () => {
    const state = deepFreeze(baseState());
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 1,
    };
    const next = attemptQuest(state, QUEST_ID, invocation);
    const p1 = next.players.find((p) => p.id === "p1")!;
    expect(p1.flags.quests_completed_total).toBe(0);
  });

  it("applies quest_roll_bonus to roll result", () => {
    // mosje_a has 1 star, threshold is 3. Roll 2 + bonus 1 = 3 => success
    const state: GameState = {
      ...baseState(),
      players: baseState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : { ...m, flags: { quest_roll_bonus: { amount: 1 } } }
              ),
            }
      ),
    };
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 2, // 2 + 1 bonus = 3 >= threshold 3
    };
    const next = attemptQuest(deepFreeze(state), QUEST_ID, invocation);
    const completedEvent = next.eventLog.find((e) => e.type === "quest_completed");
    expect(completedEvent).toBeDefined();
  });

  it("triggers quest_master victory when quests_completed_total reaches 7", () => {
    const state: GameState = {
      ...baseState(),
      players: baseState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, flags: { quests_completed_total: 6 } }
      ),
    };
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 6,
    };
    const next = attemptQuest(deepFreeze(state), QUEST_ID, invocation);
    const winEvent = next.eventLog.find((e) => e.type === "game_won");
    expect(winEvent).toBeDefined();
    if (winEvent?.type === "game_won") {
      expect(winEvent.reason).toBe("quest_master");
    }
  });

  it("consumes next_quest_drain_target buff after quest resolves", () => {
    const targetRef = { playerId: "p2", instanceId: "m3" };
    const state: GameState = {
      ...baseState(),
      players: baseState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : {
                      ...m,
                      flags: {
                        next_quest_drain_target: {
                          data: { targetRef, drainAmount: 25 },
                        },
                      },
                    }
              ),
            }
      ),
    };
    const invocation: QuestInvocation = {
      actingPlayerId: "p1",
      actingMosjeRef: p1MosjeRef,
      diceRollOverride: 6,
    };
    const next = attemptQuest(deepFreeze(state), QUEST_ID, invocation);
    const p1After = next.players.find((p) => p.id === "p1")!;
    const m1After = p1After.mosjes.find((m) => m.instanceId === "m1")!;
    expect(m1After.flags["next_quest_drain_target"]).toBeUndefined();
    // p2 m3 should have lost 25 mp
    const p2After = next.players.find((p) => p.id === "p2")!;
    const m3After = p2After.mosjes.find((m) => m.instanceId === "m3")!;
    expect(m3After.mp).toBeLessThan(40);
  });
});
