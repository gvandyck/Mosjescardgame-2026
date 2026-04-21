import { beforeEach, describe, expect, it } from "vitest";
import { appendEvent } from "../../src/engine/append-event.js";
import { createGame } from "../../src/engine/create-game.js";
import { enterPlace, exitPlace } from "../../src/engine/place-manager.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { PlaceDefinition } from "../../src/cards/schema/place-definition.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  return createGame({
    seed: 7,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("d1")],
        mosjes: [
          { cardId: id("mosje_1"), startMP: 10 },
          { cardId: id("mosje_2"), startMP: 10 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("d2")],
        mosjes: [
          { cardId: id("mosje_3"), startMP: 10 },
          { cardId: id("mosje_4"), startMP: 10 }
        ]
      }
    ]
  });
}

function activeRef(state: GameState, playerId: string) {
  const player = state.players.find((p) => p.id === playerId);
  if (player === undefined) throw new Error("player not found");
  return player.mosjes[player.activeMosjeIndex];
}

function mp(state: GameState, playerId: string): number {
  return activeRef(state, playerId).mp;
}

function place(cardId: string, def: Partial<PlaceDefinition>): PlaceDefinition {
  return {
    id: id(cardId),
    name: cardId,
    category: "place",
    subcategory: "TEST",
    rarity: "common",
    isBoosterOnly: false,
    cost: { type: "free" },
    requirements: [],
    target: "none",
    trigger: "passive",
    duration: "while_active",
    effects: [],
    triggers: [],
    ...def
  };
}

beforeEach(() => {
  clearRegistry();
});

describe("place manager", () => {
  it("enterPlace with no prior place sets activePlace and runs onEnterEffects", () => {
    registerCard(
      place("place_enter_test", {
        onEnterEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 7 } }]
      })
    );

    const next = enterPlace(baseState(), id("place_enter_test"));

    expect(next.activePlace?.cardId).toBe("place_enter_test");
    expect(next.activePlace?.subscribedTriggers).toHaveLength(0);
    expect(mp(next, "p1")).toBe(17);
    expect(next.eventLog.some((event) => event.type === "place_entered")).toBe(true);
  });

  it("enterPlace with prior place exits old place first and enters new place", () => {
    registerCard(
      place("place_a", {
        onExitEffects: [{ primitive: "loseMP", params: { target: "$self", amount: 5, isCostPayment: false } }]
      })
    );
    registerCard(
      place("place_b", {
        onEnterEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 3 } }]
      })
    );

    const withA = enterPlace(baseState(), id("place_a"));
    const withB = enterPlace(withA, id("place_b"));

    expect(withB.activePlace?.cardId).toBe("place_b");
    expect(mp(withB, "p1")).toBe(8);
    const destroyedIndex = withB.eventLog.findIndex((event) => event.type === "place_destroyed");
    const enteredIndex = withB.eventLog.findIndex(
      (event, index) => index > destroyedIndex && event.type === "place_entered"
    );
    expect(destroyedIndex).toBeGreaterThanOrEqual(0);
    expect(enteredIndex).toBeGreaterThan(destroyedIndex);
  });

  it("exitPlace clears activePlace, runs onExitEffects, and emits place_destroyed", () => {
    registerCard(
      place("place_exit_test", {
        onExitEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 9 } }]
      })
    );

    const entered = enterPlace(baseState(), id("place_exit_test"));
    const exited = exitPlace(entered);

    expect(exited.activePlace).toBeNull();
    expect(mp(exited, "p1")).toBe(19);
    expect(exited.eventLog.some((event) => event.type === "place_destroyed")).toBe(true);
  });

  it("resolveActivePlaceTriggers fires effects for matching events and skips non-matching", () => {
    registerCard(
      place("place_trigger_test", {
        triggers: [
          {
            on: "quest_completed",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 11 } }]
          }
        ]
      })
    );

    const entered = enterPlace(baseState(), id("place_trigger_test"));
    const noFire = appendEvent(entered, { type: "turn_started", turn: 1, playerId: "p1" });
    const fired = appendEvent(noFire, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 4
    });

    expect(mp(noFire, "p1")).toBe(10);
    expect(mp(fired, "p1")).toBe(21);
    expect(fired.eventLog.some((event) => event.type === "place_trigger_fired")).toBe(true);
  });

  it("forPlayer='active' only fires on currentPlayerId turn_end events", () => {
    registerCard(
      place("place_active_only", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "active",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 4 } }]
          }
        ]
      })
    );

    const entered = enterPlace(baseState(), id("place_active_only"));
    const mismatch = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );
    const match = appendEvent(
      { ...mismatch, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(mismatch, "p2")).toBe(10);
    expect(mp(match, "p1")).toBe(14);
  });

  it("forPlayer='both' fires for both players on turn_end", () => {
    registerCard(
      place("place_both", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 2 } }]
          }
        ]
      })
    );

    const entered = enterPlace(baseState(), id("place_both"));
    const p1Turn = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );
    const p2Turn = appendEvent(
      { ...p1Turn, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 2, playerId: "p2" }
    );

    expect(mp(p1Turn, "p1")).toBe(12);
    expect(mp(p2Turn, "p2")).toBe(12);
  });

  it("ghost listener test: replacing Place A with B prevents A triggers from firing", () => {
    registerCard(
      place("place_a", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 1 } }]
          }
        ]
      })
    );
    registerCard(
      place("place_b", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 2 } }]
          }
        ]
      })
    );

    let state = enterPlace(baseState(), id("place_a"));
    state = enterPlace(state, id("place_b"));

    for (let i = 1; i <= 10; i += 1) {
      state = appendEvent(
        { ...state, currentPlayerId: "p1" },
        { type: "turn_ended", turn: i, playerId: "p1" }
      );
    }

    expect(mp(state, "p1")).toBe(30);
  });

  it("ghost listener test: after exitPlace no triggers fire", () => {
    registerCard(
      place("place_ghost", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 3 } }]
          }
        ]
      })
    );

    let state = enterPlace(baseState(), id("place_ghost"));
    state = exitPlace(state);

    for (let i = 1; i <= 5; i += 1) {
      state = appendEvent(
        { ...state, currentPlayerId: "p1" },
        { type: "turn_ended", turn: i, playerId: "p1" }
      );
    }

    expect(mp(state, "p1")).toBe(10);
  });

  it("state with active place is serializable", () => {
    registerCard(
      place("place_serializable", {
        triggers: [
          {
            on: "turn_end",
            forPlayer: "both",
            effects: [{ primitive: "gainMP", params: { target: "$self", amount: 1 } }]
          }
        ]
      })
    );

    const state = enterPlace(baseState(), id("place_serializable"));

    expect(() => JSON.stringify(state)).not.toThrow();
  });
});
