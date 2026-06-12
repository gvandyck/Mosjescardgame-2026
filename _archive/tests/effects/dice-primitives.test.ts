import { describe, expect, it } from "vitest";
import { chooseDieResult, rerollDie, rollDie } from "../../src/effects/dice/index.js";
import { createRng } from "../../src/utils/rng.js";
import type { EffectContext } from "../../src/effects/effect-context.js";
import type { GameState } from "../../src/types/game-state.js";

function createState(): GameState {
  return {
    turnCount: 4,
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
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 10, flags: {} },
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
        totalDamageTaken: 0,
        flags: {}
      }
    ],
    activePlace: null,
    questDeck: [],
    effectStack: [],
    eventLog: [],
    rngSeed: 11,
    lastRoll: null
  };
}

function ctx(seed = 11): EffectContext {
  return {
    source: { kind: "ability", cardId: "dice_test" },
    actingPlayerId: "p1",
    rng: createRng(seed),
    turnCount: 4
  };
}

describe("dice primitives", () => {
  it("seeded rng yields deterministic rolls", () => {
    const s1 = rollDie(createState(), {}, ctx(123));
    const s2 = rollDie(createState(), {}, ctx(123));
    expect(s1.lastRoll).toEqual(s2.lastRoll);
  });

  it("reroll without prior roll is no-op warning", () => {
    const next = rerollDie(createState(), {}, ctx());
    expect(next.lastRoll).toBeNull();
    expect(next.eventLog.at(-1)).toMatchObject({ type: "warning", code: "reroll_without_prior_roll" });
  });

  it("modifier arithmetic is correct", () => {
    const next = rollDie(createState(), { modifier: 2 }, ctx(1));
    expect(next.lastRoll).not.toBeNull();
    expect((next.lastRoll?.final ?? 0) - (next.lastRoll?.raw ?? 0)).toBe(2);
  });

  it("choose die result overwrites final", () => {
    const rolled = rollDie(createState(), { modifier: 1 }, ctx(50));
    const chosen = chooseDieResult(rolled, { chosenValue: 6 }, ctx(50));
    expect(chosen.lastRoll?.final).toBe(6);
  });
});
