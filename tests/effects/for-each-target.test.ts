import { describe, expect, it } from "vitest";
import { forEachTarget } from "../../src/effects/control/for-each-target.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(playerCount: number): GameState {
  const players = Array.from({ length: playerCount }, (_, idx) => {
    const id = `p${idx + 1}`;
    const base = idx * 2;
    return {
      id,
      name: id.toUpperCase(),
      mosjes: [
        { instanceId: `m${base + 1}`, cardId: `mosje_${base + 1}`, level: 1 as const, mp: 20, flags: {} },
        { instanceId: `m${base + 2}`, cardId: `mosje_${base + 2}`, level: 1 as const, mp: 20, flags: {} }
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
      activeMosjeIndex: 0 as const,
      flags: {}
    };
  });

  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players,
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 9,
    lastRoll: null
  };
}

function ctx(): EffectContext {
  return {
    source: { kind: "card", cardId: "dikke-jonko" },
    actingPlayerId: "p1",
    rng: createRng(9),
    turnCount: 1
  };
}

describe("forEachTarget primitive", () => {
  it("targets exactly one active opponent in 2-player game", () => {
    const next = forEachTarget(
      createState(2),
      {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 5 } }
      },
      ctx()
    );

    expect(next.players[1].mosjes[0].mp).toBe(15);
    expect(next.players[1].mosjes[1].mp).toBe(20);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "for_each_completed", count: 1 });
  });

  it("targets exactly two active opponents in 3-player game", () => {
    const next = forEachTarget(
      createState(3),
      {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 5 } }
      },
      ctx()
    );

    expect(next.players[1].mosjes[0].mp).toBe(15);
    expect(next.players[2].mosjes[0].mp).toBe(15);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "for_each_completed", count: 2 });
  });

  it("is no-op when all targets are defeated", () => {
    const defeated: GameState = {
      ...createState(3),
      players: createState(3).players.map((player) => ({
        ...player,
        mosjes: player.mosjes.map((mosje) => ({ ...mosje, mp: -1 }))
      }))
    };

    const next = forEachTarget(
      defeated,
      {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 5 } }
      },
      ctx()
    );

    expect(next.players[1].mosjes[0].mp).toBe(-1);
    expect(next.players[2].mosjes[0].mp).toBe(-1);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "for_each_completed", count: 0 });
  });

  it("runs sequentially so later iterations see updated state", () => {
    const prepared: GameState = {
      ...createState(3),
      players: createState(3).players.map((player) =>
        player.id !== "p1"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje) =>
                mosje.instanceId !== "m1" ? mosje : { ...mosje, mp: 10 }
              )
            }
      )
    };

    const next = forEachTarget(
      prepared,
      {
        targetType: "all_opponents",
        effect: {
          primitive: "ifThenElse",
          params: {
            condition: {
              condition: "checkMP",
              params: { target: { playerId: "p1", instanceId: "m1" }, operator: "<=", value: 15 }
            },
            then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 10 } },
            else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }
          }
        }
      },
      ctx()
    );

    // First iteration: 10 -> +10 (condition true). Second: 20 -> +1 (condition false).
    expect(next.players[0].mosjes[0].mp).toBe(21);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "for_each_completed", count: 2 });
  });
});