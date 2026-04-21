import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../../../src/engine/create-game.js";
import { appendEvent } from "../../../src/engine/append-event.js";
import { enterPlace } from "../../../src/engine/place-manager.js";
import { clearRegistry, registerCard } from "../../../src/cards/registry/card-registry.js";
import { BANK_CHILLING } from "../../../src/cards/places/bank-chilling.js";
import { QUEST_HAVEN } from "../../../src/cards/places/quest-haven.js";
import { OBBY_1 } from "../../../src/cards/places/obby-1.js";
import { ARCADE } from "../../../src/cards/places/arcade.js";
import { SKIFFA } from "../../../src/cards/places/skiffa.js";
import type { CardId } from "../../../src/types/card-id.js";
import type { GameState } from "../../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(seed = 77): GameState {
  const created = createGame({
    seed,
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

  return {
    ...created,
    players: created.players.map((player, index) => ({
      ...player,
      mosjes: player.mosjes.map((mosje) => ({
        ...mosje,
        flags: {
          ...mosje.flags,
          traits: index === 0 ? { Social: 2, Physical: 2 } : { Social: 0, Physical: 0 }
        }
      }))
    }))
  };
}

function mp(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return player.mosjes[player.activeMosjeIndex].mp;
}

beforeEach(() => {
  clearRegistry();
  registerCard(BANK_CHILLING);
  registerCard(QUEST_HAVEN);
  registerCard(OBBY_1);
  registerCard(ARCADE);
  registerCard(SKIFFA);
});

describe("step2 batch1 places", () => {
  it("bank-chilling grants Social mosje +15 on turn_end", () => {
    const entered = enterPlace(baseState(), id("place_bank_chilling"));
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(fired, "p1")).toBe(45);
    const noSocial = appendEvent(
      { ...entered, currentPlayerId: "p2" },
      { type: "turn_ended", turn: 1, playerId: "p2" }
    );
    expect(mp(noSocial, "p2")).toBe(30);
  });

  it("bank-chilling ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_bank_chilling"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_ended", turn: 1, playerId: "p1" }
    );

    expect(mp(state, "p1")).toBe(15);
  });

  it("quest-haven grants +10 on quest_completed", () => {
    const entered = enterPlace(baseState(), id("place_quest_haven"));
    const fired = appendEvent(entered, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 5
    });

    expect(mp(fired, "p1")).toBe(40);
  });

  it("quest-haven ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_quest_haven"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(state, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 5
    });

    expect(mp(state, "p1")).toBe(30);
  });

  it("obby-1 grants +10 on quest_attempt for Physical mosje", () => {
    const entered = enterPlace(baseState(), id("place_obby_1"));
    const fired = appendEvent(entered, { type: "quest_attempted", playerId: "p1", questId: id("quest_x") });
    const notPhysical = appendEvent(entered, {
      type: "quest_attempted",
      playerId: "p2",
      questId: id("quest_x")
    });

    expect(mp(fired, "p1")).toBe(40);
    expect(mp(notPhysical, "p2")).toBe(30);
  });

  it("obby-1 ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_obby_1"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(state, { type: "quest_attempted", playerId: "p1", questId: id("quest_x") });

    expect(mp(state, "p1")).toBe(30);
  });

  it("arcade branches: 1-2 => +0, 3-4 => +15, 5-6 => +30", () => {
    const runWithSeed = (seed: number): number => {
      const fired = appendEvent(enterPlace(baseState(seed), id("place_arcade")), {
        type: "quest_completed",
        playerId: "p1",
        questId: id("quest_x"),
        reward: 0,
        rollResult: 5
      });
      return mp(fired, "p1") - 30;
    };

    let saw0 = false;
    let saw15 = false;
    let saw30 = false;
    for (let seed = 1; seed <= 200; seed += 1) {
      const delta = runWithSeed(seed);
      if (delta === 0) saw0 = true;
      if (delta === 15) saw15 = true;
      if (delta === 30) saw30 = true;
      if (saw0 && saw15 && saw30) break;
    }

    expect(saw0).toBe(true);
    expect(saw15).toBe(true);
    expect(saw30).toBe(true);
  });

  it("arcade ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(2), id("place_arcade"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(state, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 5
    });

    expect(mp(state, "p1")).toBe(30);
  });
});
