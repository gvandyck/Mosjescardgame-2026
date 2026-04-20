import { describe, expect, it } from "vitest";
import { chain, choose, ifThenElse, rollBranch } from "../../src/effects/control/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 2,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: "mosje_a",
            level: 1,
            mp: 10,
            flags: { traits: { Creative: 3 } }
          },
          { instanceId: "m2", cardId: "mosje_b", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [
          { slotIndex: 0, cardId: "p1", faceUp: false, turnsSincePlaced: 1 },
          { slotIndex: 1, cardId: "p2", faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 2, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 3, cardId: null, faceUp: false, turnsSincePlaced: 0 },
          { slotIndex: 4, cardId: null, faceUp: false, turnsSincePlaced: 0 }
        ],
        hand: [],
        deck: ["a", "b"],
        discard: [],
        welloePile: [],
        activeMosjeIndex: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_c", level: 1, mp: 10, flags: {} },
          { instanceId: "m4", cardId: "mosje_d", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
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
    rngSeed: 2,
    lastRoll: null
  };
}

function ctx(seed = 2): EffectContext {
  return {
    source: { kind: "ability", cardId: "control" },
    actingPlayerId: "p1",
    rng: createRng(seed),
    turnCount: 2
  };
}

describe("control primitives", () => {
  it("chain of gainMP accumulates", () => {
    const effects = Array.from({ length: 5 }, () => ({
      primitive: "gainMP",
      params: { target: { playerId: "p1", instanceId: "m1" }, amount: 5 }
    }));
    const next = chain(createState(), { effects }, ctx());
    expect(next.players[0].mosjes[0].mp).toBe(35);
  });

  it("if-then-else picks branch by condition", () => {
    const thenState = ifThenElse(
      createState(),
      {
        condition: {
          condition: "checkTrait",
          params: { target: { playerId: "p1", instanceId: "m1" }, trait: "Creative", minStars: 3 }
        },
        then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 50 } },
        else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 } }
      },
      ctx()
    );

    expect(thenState.players[0].mosjes[0].mp).toBe(60);

    const elseState = ifThenElse(
      createState(),
      {
        condition: {
          condition: "checkTrait",
          params: { target: { playerId: "p1", instanceId: "m1" }, trait: "Creative", minStars: 4 }
        },
        then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 50 } },
        else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 } }
      },
      ctx()
    );

    expect(elseState.players[0].mosjes[0].mp).toBe(30);
  });

  it("chain aborts on error and keeps partial state", () => {
    const next = chain(
      createState(),
      {
        effects: [
          { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } },
          { primitive: "activateFaceDownPiecie", params: { playerId: "p1", slotIndex: 1 } },
          { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } }
        ]
      },
      ctx()
    );

    expect(next.players[0].mosjes[0].mp).toBe(20);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "warning", code: "chain_effect_failed" });
  });

  it("roll-branch is deterministic with seeded rng", () => {
    const params = {
      branches: [
        { range: [1, 2] as const, effect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 5 } } },
        { range: [3, 4] as const, effect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } } },
        { range: [5, 6] as const, effect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 15 } } }
      ]
    };

    const a = rollBranch(createState(), params, ctx(222));
    const b = rollBranch(createState(), params, ctx(222));
    expect(a.players[0].mosjes[0].mp).toBe(b.players[0].mosjes[0].mp);
  });

  it("choose uses mock resolver", () => {
    const next = choose(
      createState(),
      {
        chooserId: "p1",
        options: [
          { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } },
          { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 9 } }
        ],
        resolver: () => 1
      },
      ctx()
    );

    expect(next.players[0].mosjes[0].mp).toBe(19);
  });
});
