import { describe, expect, it } from "vitest";
import { applyBuff, clearExpiredBuffs } from "../../src/effects/buffs/index.js";
import { discardCards, drawCards, returnToHand, searchDeckAndDraw } from "../../src/effects/cards/index.js";
import { choose, ifThenElse, rollBranch } from "../../src/effects/control/index.js";
import { chooseDieResult, rerollDie, rollDie } from "../../src/effects/dice/index.js";
import { gainMP, loseMP } from "../../src/effects/mp/index.js";
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
          { instanceId: "m1", cardId: "mosje_1", level: 1, mp: 20, flags: { traits: { Creative: 2 } } },
          { instanceId: "m2", cardId: "partner", level: 1, mp: 10, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: ["h1", "h2"],
        deck: ["d1"],
        discard: ["x1"],
        welloePile: [],
        activeMosjeIndex: 0,
        totalDamageTaken: 0,
        flags: {}
      },
      {
        id: "p2",
        name: "P2",
        mosjes: [
          { instanceId: "m3", cardId: "mosje_3", level: 1, mp: 20, flags: {} },
          { instanceId: "m4", cardId: "mosje_4", level: 1, mp: 20, flags: {} }
        ],
        piecieSlots: [0, 1, 2, 3, 4].map((i) => ({
          slotIndex: i as 0 | 1 | 2 | 3 | 4,
          cardId: null,
          faceUp: false,
          turnsSincePlaced: 0
        })),
        hand: [],
        deck: ["e1"],
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
    rngSeed: 17,
    lastRoll: null
  };
}

function ctx(seed = 17): EffectContext {
  return {
    source: { kind: "ability", cardId: "coverage" },
    actingPlayerId: "p1",
    rng: createRng(seed),
    turnCount: 2
  };
}

describe("effect branch coverage", () => {
  it("covers choose warnings and invalid index", () => {
    const missingResolver = choose(createState(), { chooserId: "p1", options: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }] }, ctx());
    expect(missingResolver.eventLog.at(-1)).toMatchObject({ code: "choose_missing_resolver" });

    const invalidIndex = choose(
      createState(),
      {
        chooserId: "p1",
        options: [{ primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }],
        resolver: () => 9
      },
      ctx()
    );
    expect(invalidIndex.eventLog.at(-1)).toMatchObject({ code: "choose_invalid_index" });
  });

  it("covers roll-branch no matching range", () => {
    const next = rollBranch(createState(), { branches: [{ range: [7, 9], effect: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 99 } } }] }, ctx());
    expect(next.lastRoll).not.toBeNull();
    expect(next.players[0].mosjes[0].mp).toBe(20);
  });

  it("covers if-then-else unknown condition fallback", () => {
    const next = ifThenElse(
      createState(),
      {
        condition: { condition: "unknown", params: {} },
        then: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 99 } },
        else: { primitive: "gainMP", params: { target: { playerId: "p1", instanceId: "m1" }, amount: 1 } }
      },
      ctx()
    );
    expect(next.players[0].mosjes[0].mp).toBe(21);
  });

  it("covers dice choose/reroll branches", () => {
    const chooseNoRoll = chooseDieResult(createState(), { chosenValue: 5 }, ctx());
    expect(chooseNoRoll.eventLog.at(-1)).toMatchObject({ code: "choose_die_without_prior_roll" });

    const rolled = rollDie(createState(), { modifier: 1 }, ctx(2));
    const rerolled = rerollDie(rolled, {}, ctx(2));
    expect(rerolled.eventLog.at(-1)).toMatchObject({ type: "die_rerolled" });
  });

  it("covers card primitive failure and alternate branches", () => {
    const chooseDiscard = discardCards(
      createState(),
      { playerId: "p1", count: 1, mode: "choose", chosenCardIds: ["h1"] },
      ctx()
    );
    expect(chooseDiscard.players[0].discard).toContain("h1");

    const filtered = searchDeckAndDraw(createState(), { playerId: "p1", filter: { byType: "mosje" } }, ctx());
    expect(filtered.eventLog.at(-1)).toMatchObject({ code: "search_filter_metadata_unavailable" });

    const missingReturn = returnToHand(createState(), { playerId: "p1", zone: "welloe", cardId: "missing" }, ctx());
    expect(missingReturn.eventLog.at(-1)).toMatchObject({ code: "return_to_hand_card_missing" });

    const drawTwice = drawCards(createState(), { playerId: "p1", count: 2 }, ctx());
    expect(drawTwice.eventLog.at(-1)).toMatchObject({ code: "draw_empty_deck" });
  });

  it("covers buff player-target and expiry loops", () => {
    const withPlayerBuff = applyBuff(
      createState(),
      { target: { playerId: "p1" }, buffId: "team", data: { on: true }, expiryTurn: 2 },
      ctx()
    );
    const cleared = clearExpiredBuffs(withPlayerBuff, {}, ctx());
    expect(cleared.players[0].flags["buff:team"]).toBeUndefined();
  });

  it("covers mp edge branches", () => {
    const invalidLose = loseMP(createState(), { target: { playerId: "p1", instanceId: "m1" }, amount: 0 }, ctx());
    expect(invalidLose.eventLog.at(-1)).toMatchObject({ code: "lose_mp_invalid_amount" });

    const noMultiplier = gainMP(createState(), { target: { playerId: "p1", instanceId: "m1" }, amount: 5 }, ctx());
    expect(noMultiplier.players[0].mosjes[0].mp).toBe(25);
  });
});
