import { describe, expect, it } from "vitest";
import { checkVictory } from "../../src/engine/check-victory.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function card(id: string): CardId {
  return id as CardId;
}

function baseState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "draw",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: card("a"), level: 1, mp: 50, flags: {} },
          { instanceId: "m2", cardId: card("b"), level: 1, mp: 60, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: { quests_completed_total: 0 }
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: card("c"), level: 1, mp: 40, flags: {} },
          { instanceId: "m4", cardId: card("d"), level: 1, mp: 30, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 1, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [],
        deck: [],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: { quests_completed_total: 0 }
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 1
  };
}

describe("checkVictory", () => {
  it("detects level 3 win condition", () => {
    const state = {
      ...baseState(),
      players: [
        { ...baseState().players[0], mosjes: [{ ...baseState().players[0].mosjes[0], level: 3 }, baseState().players[0].mosjes[1]] },
        baseState().players[1]
      ]
    };
    expect(checkVictory(state)).toEqual({ winnerId: "p1", reason: "level_3" });
  });

  it("detects knockout condition", () => {
    const state = {
      ...baseState(),
      players: [
        baseState().players[0],
        {
          ...baseState().players[1],
          mosjes: baseState().players[1].mosjes.map((mosje) => ({
            ...mosje,
            flags: { ...mosje.flags, in_welloe: true }
          }))
        }
      ]
    };
    expect(checkVictory(state)).toEqual({ winnerId: "p1", reason: "knockout" });
  });

  it("detects quest master condition", () => {
    const state = {
      ...baseState(),
      players: [{ ...baseState().players[0], flags: { quests_completed_total: 7 } }, baseState().players[1]]
    };
    expect(checkVictory(state)).toEqual({ winnerId: "p1", reason: "quest_master" });
  });

  it("detects momentum domination at draw phase", () => {
    const state = {
      ...baseState(),
      players: [
        {
          ...baseState().players[0],
          mosjes: [{ ...baseState().players[0].mosjes[0], mp: 125 }, { ...baseState().players[0].mosjes[1], mp: 125 }]
        },
        baseState().players[1]
      ]
    };
    expect(checkVictory(state)).toEqual({ winnerId: "p1", reason: "momentum_domination" });
  });

  it("applies precedence where level_3 beats momentum_domination", () => {
    const state = {
      ...baseState(),
      players: [
        {
          ...baseState().players[0],
          mosjes: [{ ...baseState().players[0].mosjes[0], level: 3, mp: 200 }, { ...baseState().players[0].mosjes[1], mp: 100 }]
        },
        baseState().players[1]
      ]
    };
    expect(checkVictory(state)).toEqual({ winnerId: "p1", reason: "level_3" });
  });

  it("has no false positives at thresholds below required", () => {
    const state = {
      ...baseState(),
      players: [
        {
          ...baseState().players[0],
          mosjes: [{ ...baseState().players[0].mosjes[0], mp: 124 }, { ...baseState().players[0].mosjes[1], mp: 125 }],
          flags: { quests_completed_total: 6 }
        },
        baseState().players[1]
      ]
    };
    expect(checkVictory(state)).toEqual({ winnerId: null, reason: null });
  });
});
