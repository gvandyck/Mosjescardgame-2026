import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../../../src/engine/create-game.js";
import { appendEvent } from "../../../src/engine/append-event.js";
import { enterPlace } from "../../../src/engine/place-manager.js";
import { clearRegistry, registerCard } from "../../../src/cards/registry/card-registry.js";
import { MOMENTUM_FACTORY } from "../../../src/cards/places/momentum-factory.js";
import { SKIFFA } from "../../../src/cards/places/skiffa.js";
import type { CardId } from "../../../src/types/card-id.js";
import type { GameState } from "../../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  return createGame({
    seed: 99,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("p1_d1")],
        mosjes: [
          { cardId: id("m1"), startMP: 30 },
          { cardId: id("m2"), startMP: 30 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("p2_d1")],
        mosjes: [
          { cardId: id("m3"), startMP: 30 },
          { cardId: id("m4"), startMP: 30 }
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
  registerCard(MOMENTUM_FACTORY);
  registerCard(SKIFFA);
});

describe("step2 batch2 places", () => {
  it("momentum-factory gives +5 on piecie_activated", () => {
    const entered = enterPlace(baseState(), id("place_momentum_factory"));
    const fired = appendEvent(entered, {
      type: "piecie_activated",
      playerId: "p1",
      slotIndex: 0,
      cardId: id("piecie_x")
    });

    expect(mp(fired, "p1")).toBe(35);
  });

  it("momentum-factory ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_momentum_factory"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(state, {
      type: "piecie_activated",
      playerId: "p1",
      slotIndex: 0,
      cardId: id("piecie_x")
    });

    expect(mp(state, "p1")).toBe(30);
  });
});
