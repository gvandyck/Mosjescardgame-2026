import { describe, expect, it } from "vitest";
import { advancePhase, endTurn, startTurn } from "../../src/engine/turn-manager.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function card(id: string): CardId {
  return id as CardId;
}

function baseState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "end",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: card("mosje_1"), level: 1, mp: 10, flags: { buff_turns: 2 } },
          { instanceId: "m2", cardId: card("mosje_2"), level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: card("piecie_a"), faceUp: false, turnsSincePlaced: 0 },
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
        flags: { shield_turns: 2 }
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: card("mosje_3"), level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: card("mosje_4"), level: 1, mp: 10, flags: {} }
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

describe("turn manager", () => {
  it("runs full 4-phase cycle and rotates to next player", () => {
    let state = startTurn(baseState());
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);

    expect(state.currentPlayerId).toBe("p2");
    expect(state.currentPhase).toBe("draw");
    expect(state.turnCount).toBe(2);
  });

  it("emits exact event order for full cycle", () => {
    let state = startTurn(baseState());
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);

    expect(state.eventLog[0]).toMatchObject({ type: "turn_started" });
    expect(state.eventLog[1]).toMatchObject({ type: "phase_changed", to: "draw" });
    expect(state.eventLog[2]).toMatchObject({ type: "phase_changed", to: "main" });
    expect(state.eventLog[3]).toMatchObject({ type: "phase_changed", to: "quest" });
    expect(state.eventLog[4]).toMatchObject({ type: "phase_changed", to: "end" });
    expect(state.eventLog[5]).toMatchObject({ type: "phase_changed", to: "draw" });
    expect(state.eventLog[6]).toMatchObject({ type: "turn_ended" });
  });

  it("increments turnsSincePlaced for face-down piecies at startTurn", () => {
    const started = startTurn(baseState());
    expect(started.players[0].piecieSlots[0].turnsSincePlaced).toBe(1);
  });

  it("expires duration flags on correct turn boundary", () => {
    const firstEnd = endTurn({ ...baseState(), currentPhase: "draw" });
    expect(firstEnd.players[0].flags).toMatchObject({ shield_turns: 1 });
    expect(firstEnd.players[0].mosjes[0].flags).toMatchObject({ buff_turns: 1 });

    const secondEnd = endTurn({ ...firstEnd, currentPlayerId: "p1" });
    expect(secondEnd.players[0].flags.shield_turns).toBeUndefined();
    expect(secondEnd.players[0].mosjes[0].flags.buff_turns).toBeUndefined();
  });
});
