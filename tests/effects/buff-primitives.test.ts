import { describe, expect, it } from "vitest";
import {
  applyBuff,
  clearExpiredBuffs,
  negateEffect,
  reduceMPLossBy
} from "../../src/effects/buffs/index.js";
import { loseMP } from "../../src/effects/mp/lose-mp.js";
import { endTurn } from "../../src/engine/end-turn.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 100, flags: {} },
          { instanceId: "m2", cardId: "mosje_2", level: 1, mp: 20, flags: {} }
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
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 100, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
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
    effectStack: [{ id: "eff-1", source: { kind: "ability" }, primitive: "gainMP", params: {}, canBeCountered: true }],
    eventLog: [],
    rngSeed: 13,
    lastRoll: null
  };
}

function ctx(turn = 5): EffectContext {
  return {
    source: { kind: "ability", cardId: "buff_test" },
    actingPlayerId: "p1",
    rng: createRng(13),
    turnCount: turn
  };
}

describe("buff primitives", () => {
  it("buff expiry clears at expiry turn", () => {
    const applied = applyBuff(
      createState(),
      { target: { playerId: "p1", instanceId: "m1" }, buffId: "temp", data: {}, expiryTurn: 7 },
      ctx(5)
    );

    const notExpired = clearExpiredBuffs(applied, {}, ctx(6));
    expect(notExpired.players[0].mosjes[0].flags["buff:temp"]).toBeDefined();

    const expired = clearExpiredBuffs(notExpired, {}, ctx(7));
    expect(expired.players[0].mosjes[0].flags["buff:temp"]).toBeUndefined();
  });

  it("buff overwrite keeps latest value", () => {
    const once = applyBuff(
      createState(),
      { target: { playerId: "p1", instanceId: "m1" }, buffId: "same", data: { amount: 10 }, expiryTurn: 8 },
      ctx()
    );
    const twice = applyBuff(
      once,
      { target: { playerId: "p1", instanceId: "m1" }, buffId: "same", data: { amount: 30 }, expiryTurn: 9 },
      ctx()
    );

    expect(twice.players[0].mosjes[0].flags["buff:same"]).toMatchObject({
      data: { amount: 30 },
      expiryTurn: 9
    });
  });

  it("reduce-mp-loss-by affects loseMP", () => {
    const reduced = reduceMPLossBy(
      createState(),
      { target: { playerId: "p1", instanceId: "m1" }, amount: 20, duration: 2 },
      ctx(5)
    );

    const next = loseMP(reduced, { target: { playerId: "p1", instanceId: "m1" }, amount: 50 }, ctx(5));
    expect(next.players[0].mosjes[0].mp).toBe(70);
  });

  it("negate effect removes pending effect", () => {
    const next = negateEffect(createState(), { pendingEffectId: "eff-1" }, ctx());
    expect(next.effectStack).toHaveLength(0);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "effect_negated", pendingEffectId: "eff-1" });
  });

  it("end-turn automatically clears expired buffs", () => {
    const applied = applyBuff(
      createState(),
      { target: { playerId: "p1", instanceId: "m1" }, buffId: "auto", data: {}, expiryTurn: 6 },
      ctx(5)
    );

    const next = endTurn(applied);
    expect(next.turnCount).toBe(6);
    expect(next.players[0].mosjes[0].flags["buff:auto"]).toBeUndefined();
  });

  it("negate missing effect is no-op", () => {
    const state = createState();
    const next = negateEffect(state, { pendingEffectId: "does-not-exist" }, ctx());
    expect(next).toEqual(state);
  });
});
