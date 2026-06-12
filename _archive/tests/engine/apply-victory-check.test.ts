import { describe, expect, it } from "vitest";
import { applyVictoryCheck } from "../../src/engine/apply-victory-check.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function card(id: string): CardId {
  return id as CardId;
}

function stateWithLevel3(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "draw",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: card("a"), level: 3, mp: 0, flags: {} },
          { instanceId: "m2", cardId: card("b"), level: 1, mp: 0, flags: {} }
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
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: card("c"), level: 1, mp: 0, flags: {} },
          { instanceId: "m4", cardId: card("d"), level: 1, mp: 0, flags: {} }
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
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 1
  };
}

describe("applyVictoryCheck", () => {
  it("appends game_won event when winner exists", () => {
    const next = applyVictoryCheck(stateWithLevel3());
    expect(next.eventLog.at(-1)).toMatchObject({ type: "game_won", playerId: "p1", reason: "level_3" });
  });

  it("does not duplicate game_won if already present", () => {
    const state = {
      ...stateWithLevel3(),
      eventLog: [{ type: "game_won", playerId: "p1", reason: "level_3" }]
    } as GameState;

    const next = applyVictoryCheck(state);
    expect(next.eventLog).toHaveLength(1);
  });
});
