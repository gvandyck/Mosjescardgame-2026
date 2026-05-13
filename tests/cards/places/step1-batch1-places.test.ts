import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../../../src/engine/create-game.js";
import { appendEvent } from "../../../src/engine/append-event.js";
import { enterPlace } from "../../../src/engine/place-manager.js";
import { gainMP } from "../../../src/effects/mp/gain-mp.js";
import { loseMP } from "../../../src/effects/mp/lose-mp.js";
import { createRng } from "../../../src/utils/rng.js";
import { clearRegistry, registerCard } from "../../../src/cards/registry/card-registry.js";
import { THE_GYM } from "../../../src/cards/places/the-gym.js";
import { SKIFFA } from "../../../src/cards/places/skiffa.js";
import { THE_VOID } from "../../../src/cards/places/the-void.js";
import { ZO_IS_NATUUR } from "../../../src/cards/places/zo-is-natuur.js";
import type { MosjeDefinition } from "../../../src/cards/schema/mosje-definition.js";
import type { CardId } from "../../../src/types/card-id.js";
import type { GameState } from "../../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  const created = createGame({
    seed: 77,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("d1")],
        mosjes: [
          { cardId: id("mosje_p1_a"), startMP: 50 },
          { cardId: id("mosje_p1_b"), startMP: 50 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("d2")],
        mosjes: [
          { cardId: id("mosje_p2_a"), startMP: 50 },
          { cardId: id("mosje_p2_b"), startMP: 50 }
        ]
      }
    ]
  });

  return {
    ...created,
    players: created.players.map((player, index) => ({
      ...player,
      mosjes: player.mosjes.map((mosje) => ({
        ...mosje,
        flags: {
          ...mosje.flags,
          traits:
            index === 0
              ? { Physical: 3, Resilient: 1 }
              : { Physical: 1, Resilient: 0 }
        }
      }))
    }))
  };
}

function activeRef(state: GameState, playerId: string) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return { playerId, instanceId: player.mosjes[player.activeMosjeIndex].instanceId };
}

function mp(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return player.mosjes[player.activeMosjeIndex].mp;
}

const FIGHTER_MOSJE: MosjeDefinition = {
  id: id("mosje_fighter"),
  name: "Fighter",
  category: "mosje",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 1, Mental: 0, Social: 0, Creative: 0, Technical: 0, Resilient: 0 },
  startMP: 50,
  baseAbility: {
    trigger: "on_play",
    usageLimit: "passive",
    effects: [],
    description: ""
  }
};

beforeEach(() => {
  clearRegistry();
  registerCard(THE_GYM);
  registerCard(SKIFFA);
  registerCard(THE_VOID);
  registerCard(ZO_IS_NATUUR);
});

describe("step1 batch1 places", () => {
  it("the-gym enters and applies turn_end effect", () => {
    const entered = enterPlace(baseState(), id("place_the_gym"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(entered.activePlace?.cardId).toBe("place_the_gym");
    expect(mp(fired, "p1")).toBe(85);
    expect(mp(fired, "p2")).toBe(40);
  });

  it("the-gym ghost listener stops after place replacement", () => {
    let state = enterPlace(baseState(), id("place_the_gym"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(state, "p1")).toBe(35);
    expect(mp(state, "p2")).toBe(35);
  });

  it("skiffa enters and drains all mosjes on turn_end", () => {
    const entered = enterPlace(baseState(), id("place_skiffa"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );

    expect(entered.activePlace?.cardId).toBe("place_skiffa");
    expect(mp(fired, "p1")).toBe(35);
    expect(mp(fired, "p2")).toBe(35);
  });

  it("skiffa ghost listener stops after place replacement", () => {
    let state = enterPlace(baseState(), id("place_skiffa"));
    state = enterPlace(state, id("place_zo_is_natuur"));
    state = appendEvent(
      { ...state, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );

    expect(mp(state, "p1")).toBe(65);
    expect(mp(state, "p2")).toBe(60);
  });

  it("the-void blocks gainMP/loseMP effect changes but keeps cost payments", () => {
    const entered = enterPlace(baseState(), id("place_the_void"));
    const p1 = activeRef(entered, "p1");

    const blockedGain = gainMP(
      entered,
      { target: p1, amount: 20 },
      {
        source: { kind: "card", cardId: id("x") },
        actingPlayerId: "p1",
        rng: createRng(1),
        turnCount: entered.turnCount
      }
    );
    const blockedLoss = loseMP(
      blockedGain,
      { target: p1, amount: 20, isCostPayment: false },
      {
        source: { kind: "card", cardId: id("x") },
        actingPlayerId: "p1",
        rng: createRng(1),
        turnCount: entered.turnCount
      }
    );
    const costLoss = loseMP(
      blockedLoss,
      { target: p1, amount: 10, isCostPayment: true },
      {
        source: { kind: "cost" },
        actingPlayerId: "p1",
        rng: createRng(1),
        turnCount: entered.turnCount
      }
    );

    expect(entered.gameFlags["void_active"]).toBe(true);
    expect(mp(blockedLoss, "p1")).toBe(50);
    expect(mp(costLoss, "p1")).toBe(40);
  });

  it("the-void ghost listener behavior: replacing void removes blocking", () => {
    const entered = enterPlace(baseState(), id("place_the_void"));
    const replaced = enterPlace(entered, id("place_skiffa"));
    const p1 = activeRef(replaced, "p1");

    const gained = gainMP(
      replaced,
      { target: p1, amount: 20 },
      {
        source: { kind: "card", cardId: id("x") },
        actingPlayerId: "p1",
        rng: createRng(1),
        turnCount: replaced.turnCount
      }
    );

    expect(replaced.gameFlags["void_active"]).toBe(false);
    expect(mp(gained, "p1")).toBe(70);
  });

  it("the-gym gives Physical 2 mosje +25 MP (middle branch, not FIGHTING type check)", () => {
    registerCard(FIGHTER_MOSJE);

    // p2 has Physical 2 — should get +25 MP (not dependent on mosjeType)
    const prepared = {
      ...baseState(),
      players: baseState().players.map((player) =>
        player.id !== "p2"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje, index) =>
                index === player.activeMosjeIndex
                  ? {
                      ...mosje,
                      cardId: id("mosje_fighter"),
                      flags: {
                        ...mosje.flags,
                        traits: { Physical: 2, Resilient: 0 }
                      }
                    }
                  : mosje
              )
            }
      )
    };

    const entered = enterPlace(prepared, id("place_the_gym"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(fired, "p2")).toBe(75); // 50 + 25 (Physical 2)
  });

  it("the-gym applies -10 MP to Mosje with Physical 1 (below threshold)", () => {
    registerCard(FIGHTER_MOSJE);

    // p2 is a FIGHTING type but only Physical 1 — should lose 10 MP
    const prepared = {
      ...baseState(),
      players: baseState().players.map((player) =>
        player.id !== "p2"
          ? player
          : {
              ...player,
              mosjes: player.mosjes.map((mosje, index) =>
                index === player.activeMosjeIndex
                  ? {
                      ...mosje,
                      cardId: id("mosje_fighter"),
                      flags: {
                        ...mosje.flags,
                        traits: { Physical: 1, Resilient: 0 }
                      }
                    }
                  : mosje
              )
            }
      )
    };

    const entered = enterPlace(prepared, id("place_the_gym"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(fired, "p2")).toBe(40); // 50 - 10 (Physical < 2, no bonus)
  });

  it("zo-is-natuur enters and applies resilient split at turn_end", () => {
    const entered = enterPlace(baseState(), id("place_zo_is_natuur"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(entered.activePlace?.cardId).toBe("place_zo_is_natuur");
    expect(mp(fired, "p1")).toBe(65);
    expect(mp(fired, "p2")).toBe(60);
  });

  it("zo-is-natuur ghost listener stops after place replacement", () => {
    let state = enterPlace(baseState(), id("place_zo_is_natuur"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(state, "p1")).toBe(35);
    expect(mp(state, "p2")).toBe(35);
  });
});
