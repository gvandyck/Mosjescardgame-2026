import { describe, expect, it } from "vitest";
import {
  activateFaceDownPiecie,
  destroyPiecie,
  enterPlace
} from "../../src/effects/board/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 3,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 10, flags: {} },
          { instanceId: "m2", cardId: "mosje_2", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "p_a", faceUp: false, turnsSincePlaced: 1 },
          { slotIndex: 1, cardId: "p_b", faceUp: false, turnsSincePlaced: 0 },
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
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "opp_a", faceUp: false, turnsSincePlaced: 1 },
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
    activePlace: { cardId: "old_place", flags: {} },
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 5,
    lastRoll: null
  };
}

function ctx(): EffectContext {
  return {
    source: { kind: "ability" },
    actingPlayerId: "p1",
    rng: createRng(5),
    turnCount: 3
  };
}

describe("board primitives", () => {
  it("enter place auto-destroys prior place", () => {
    const next = enterPlace(createState(), { cardId: "new_place", playerId: "p1" }, ctx());
    expect(next.activePlace?.cardId).toBe("new_place");
    expect(next.eventLog.map((event) => event.type)).toEqual(["place_destroyed", "place_entered"]);
  });

  it("destroy piecie sends card to owner discard", () => {
    const next = destroyPiecie(createState(), { target: { playerId: "p2", slotIndex: 0 } }, ctx());
    expect(next.players[1].discard).toEqual(["opp_a"]);
    expect(next.players[0].discard).toEqual([]);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "piecie_destroyed", cardId: "opp_a" });
  });

  it("activate face-down rejects same-turn placement", () => {
    const state = createState();
    expect(() =>
      activateFaceDownPiecie(state, { playerId: "p1", slotIndex: 1 }, ctx())
    ).toThrow("Cannot activate face-down piecie on the same turn it was placed");
  });

  it("activate face-down succeeds when slot aged", () => {
    const state = createState();
    const next = activateFaceDownPiecie(state, { playerId: "p1", slotIndex: 0 }, ctx());
    expect(next.players[0].piecieSlots[0].faceUp).toBe(true);
  });
});
