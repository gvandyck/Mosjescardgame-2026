import { describe, expect, it } from "vitest";
import { appendEvent, eventsSince } from "../../src/engine/event-bus.js";
import { deepFreeze } from "../../src/utils/freeze.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function baseState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "draw",
    players: [],
    activePlace: null,
    questDeck: [] as ReadonlyArray<CardId>,
    effectStack: [],
    eventLog: [],
    rngSeed: 1
  };
}

describe("event bus", () => {
  it("appendEvent is pure and does not mutate original state", () => {
    const state = deepFreeze(baseState());
    const next = appendEvent(state, { type: "turn_started", turn: 1, playerId: "p1" });

    expect(state.eventLog).toHaveLength(0);
    expect(next.eventLog).toHaveLength(1);
  });

  it("eventsSince filters from the requested turn onward", () => {
    const s1 = appendEvent(baseState(), { type: "turn_started", turn: 1, playerId: "p1" });
    const s2 = appendEvent(s1, { type: "card_drawn", playerId: "p1", cardId: "c1" as CardId });
    const s3 = appendEvent(s2, { type: "turn_started", turn: 2, playerId: "p2" });
    const s4 = appendEvent(s3, { type: "card_drawn", playerId: "p2", cardId: "c2" as CardId });

    const afterTurn2 = eventsSince(s4, 2);

    expect(afterTurn2).toHaveLength(2);
    expect(afterTurn2[0]).toMatchObject({ type: "turn_started", turn: 2 });
    expect(afterTurn2[1]).toMatchObject({ type: "card_drawn", playerId: "p2" });
  });

  it("handles 1000 sequential appends in order", () => {
    let state = baseState();

    for (let i = 1; i <= 1000; i += 1) {
      state = appendEvent(state, { type: "turn_started", turn: i, playerId: "p1" });
    }

    expect(state.eventLog).toHaveLength(1000);
    expect(state.eventLog[0]).toMatchObject({ type: "turn_started", turn: 1 });
    expect(state.eventLog[999]).toMatchObject({ type: "turn_started", turn: 1000 });
  });
});
