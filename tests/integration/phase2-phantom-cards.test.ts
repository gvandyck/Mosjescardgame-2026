import { describe, expect, it } from "vitest";
import { endTurn } from "../../src/engine/end-turn.js";
import { resolvePrimitive } from "../../src/effects/registry.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 1,
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
          { instanceId: "m2", cardId: "partner", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: ["d1", "d2", "d3"],
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
          { instanceId: "m3", cardId: "mosje_c", level: 1, mp: 80, flags: {} },
          { instanceId: "m4", cardId: "mosje_d", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: ["e1", "e2"],
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
    rngSeed: 101,
    lastRoll: null
  };
}

function ctx(seed: number): EffectContext {
  return {
    source: { kind: "ability", cardId: "phantom" },
    actingPlayerId: "p1",
    rng: createRng(seed),
    turnCount: 1
  };
}

describe("phase 2 phantom cards", () => {
  it("simple gain", () => {
    const state = createState();
    const next = resolvePrimitive("gainMP")(state, { target: { playerId: "p1", instanceId: "m1" }, amount: 25 }, ctx(1));
    expect(next.players[0].mosjes[0].mp).toBe(35);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "mp_gained", amount: 25 });
  });

  it("conditional gain runs both branches", () => {
    const conditionExpr = {
      condition: { condition: "checkTrait", params: { target: { playerId: "p1", instanceId: "m1" }, trait: "Creative", minStars: 3 } },
      then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 50 } },
      else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 20 } }
    };

    const thenState = resolvePrimitive("ifThenElse")(createState(), conditionExpr, ctx(2));
    expect(thenState.players[0].mosjes[0].mp).toBe(60);

    const elseInput = {
      ...createState(),
      players: createState().players.map((player) =>
        player.id === "p1"
          ? {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId === "m1"
                  ? { ...mosje, flags: { traits: { Creative: 2 } } }
                  : mosje
              )
            }
          : player
      )
    };

    const elseState = resolvePrimitive("ifThenElse")(elseInput, conditionExpr, ctx(2));
    expect(elseState.players[0].mosjes[0].mp).toBe(30);
  });

  it("stacked modifiers follow U6 order", () => {
    const prepared = {
      ...createState(),
      activePlace: { cardId: "place_boost", flags: { u6_place_multiplier: 1 }, subscribedTriggers: [] },
      players: createState().players.map((player) =>
        player.id === "p1"
          ? {
              ...player,
              flags: { ...player.flags, u6_partner_multiplier: 2 },
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId === "m1"
                  ? {
                      ...mosje,
                      flags: {
                        ...mosje.flags,
                        u6_ronald_bonus: 10,
                        mp_gain_multiplier: { multiplier: 1.5, duration: "next_gain" }
                      }
                    }
                  : mosje
              )
            }
          : player
      )
    };

    const next = resolvePrimitive("gainMP")(prepared, { target: { playerId: "p1", instanceId: "m1" }, amount: 50 }, ctx(3));
    const gainEvent = next.eventLog.find((event) => event.type === "mp_gained");
    expect(gainEvent).toMatchObject({ type: "mp_gained", amount: 180 });
  });

  it("roll-branch chaos distribution", () => {
    let loseCount = 0;
    let neutralCount = 0;
    let gainDrawCount = 0;

    for (let seed = 1; seed <= 300; seed += 1) {
      const state = createState();
      const next = resolvePrimitive("rollBranch")(
        state,
        {
          branches: [
            { range: [1, 2], effect: { primitive: "loseMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } } },
            { range: [3, 4], effect: { primitive: "chain", params: { effects: [] } } },
            {
              range: [5, 6],
              effect: {
                primitive: "chain",
                params: {
                  effects: [
                    { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } },
                    { primitive: "drawCards", params: { playerId: "p1", count: 1 } }
                  ]
                }
              }
            }
          ]
        },
        ctx(seed)
      );

      const mp = next.players[0].mosjes[0].mp;
      const hand = next.players[0].hand.length;
      if (mp < 10) loseCount += 1;
      else if (mp > 10 && hand === 1) gainDrawCount += 1;
      else neutralCount += 1;
    }

    const total = 300;
    const loseRate = loseCount / total;
    const neutralRate = neutralCount / total;
    const gainRate = gainDrawCount / total;

    expect(loseRate).toBeGreaterThanOrEqual(0.2833);
    expect(loseRate).toBeLessThanOrEqual(0.3833);
    expect(neutralRate).toBeGreaterThanOrEqual(0.2833);
    expect(neutralRate).toBeLessThanOrEqual(0.3833);
    expect(gainRate).toBeGreaterThanOrEqual(0.2833);
    expect(gainRate).toBeLessThanOrEqual(0.3833);
  });

  it("duration buff applies for 2 turns then expires", () => {
    const withBuff = resolvePrimitive("reduceMPLossBy")(
      createState(),
      { target: { playerId: "p1", instanceId: "m1" }, amount: 20, duration: 2 },
      ctx(10)
    );

    const t1 = resolvePrimitive("loseMP")(withBuff, { target: { playerId: "p1", instanceId: "m1" }, amount: 30 }, ctx(10));
    expect(t1.players[0].mosjes[0].mp).toBe(0);

    const turn2 = endTurn(t1);
    const t2 = resolvePrimitive("loseMP")(turn2, { target: { playerId: "p1", instanceId: "m1" }, amount: 30 }, {
      ...ctx(11),
      turnCount: turn2.turnCount
    });
    expect(t2.players[0].mosjes[0].mp).toBe(-10);

    const turn3 = endTurn(t2);
    const t3 = resolvePrimitive("loseMP")(turn3, { target: { playerId: "p1", instanceId: "m1" }, amount: 30 }, {
      ...ctx(12),
      turnCount: turn3.turnCount
    });
    expect(t3.players[0].mosjes[0].mp).toBe(-40);
  });
});
