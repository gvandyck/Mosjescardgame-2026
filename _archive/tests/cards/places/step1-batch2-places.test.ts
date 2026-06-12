import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../../../src/engine/create-game.js";
import { appendEvent } from "../../../src/engine/append-event.js";
import { enterPlace } from "../../../src/engine/place-manager.js";
import { clearRegistry, registerCard } from "../../../src/cards/registry/card-registry.js";
import { DELLUFT } from "../../../src/cards/places/delluft.js";
import { DRAIN_ZONE } from "../../../src/cards/places/drain-zone.js";
import { SKIFFA } from "../../../src/cards/places/skiffa.js";
import type { CardId } from "../../../src/types/card-id.js";
import type { GameState } from "../../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  return createGame({
    seed: 88,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("p1_d1"), id("p1_d2")],
        mosjes: [
          { cardId: id("mosje_p1_a"), startMP: 40 },
          { cardId: id("mosje_p1_b"), startMP: 40 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("p2_d1"), id("p2_d2")],
        mosjes: [
          { cardId: id("mosje_p2_a"), startMP: 40 },
          { cardId: id("mosje_p2_b"), startMP: 40 }
        ]
      }
    ]
  });
}

function mp(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return player.mosjes[player.activeMosjeIndex].mp;
}

beforeEach(() => {
  clearRegistry();
  registerCard(DELLUFT);
  registerCard(DRAIN_ZONE);
  registerCard(SKIFFA);
});

describe("step1 batch2 places", () => {
  it("delluft enters and draws for the turn-ending player", () => {
    const entered = enterPlace(baseState(), id("place_delluft"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );

    expect(entered.activePlace?.cardId).toBe("place_delluft");
    expect(fired.players[1].hand).toHaveLength(1);
    expect(fired.players[1].deck).toHaveLength(1);
  });

  it("delluft ghost listener stops after place replacement", () => {
    let state = enterPlace(baseState(), id("place_delluft"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );

    expect(state.players[1].hand).toHaveLength(0);
    expect(mp(state, "p1")).toBe(25);
    expect(mp(state, "p2")).toBe(25);
  });

  it("drain-zone penalizes the lowest MP Mosje at turn_end", () => {
    // Both players start at 40 MP. Tied lowest → first player (p1) is selected.
    const entered = enterPlace(baseState(), id("place_drain_zone"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(entered.activePlace?.cardId).toBe("place_drain_zone");
    // One Mosje loses 10 MP; the other is unaffected
    expect(mp(fired, "p1") + mp(fired, "p2")).toBe(70); // 40 + 40 - 10
  });

  it("drain-zone ghost listener stops after place replacement", () => {
    let state = enterPlace(baseState(), id("place_drain_zone"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(state, "p1")).toBe(25);
    expect(mp(state, "p2")).toBe(25);
  });
});
