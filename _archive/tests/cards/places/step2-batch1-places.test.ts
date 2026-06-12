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
          // p1: Social 2, Physical 2, Technical 2 — qualifies for multiple Place bonuses
          // p2: no traits
          traits: index === 0 ? { Social: 2, Physical: 2, Technical: 2 } : { Social: 0, Physical: 0, Technical: 0 }
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
  // ─── Bank Chilling ───────────────────────────────────────────────────────────
  it("bank-chilling grants Social 2+ mosje +15 on turn_start", () => {
    const entered = enterPlace(baseState(), id("place_bank_chilling"));

    // Social mosje: fires on turn_started for p1
    const fired = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_started", turn: 1, playerId: "p1" }
    );
    expect(mp(fired, "p1")).toBe(45); // 30 + 15

    // Non-social mosje: no bonus for p2
    const noSocial = appendEvent(
      { ...entered, currentPlayerId: "p2" },
      { type: "turn_started", turn: 1, playerId: "p2" }
    );
    expect(mp(noSocial, "p2")).toBe(30);
  });

  it("bank-chilling ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_bank_chilling"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_started", turn: 1, playerId: "p1" }
    );
    // Skiffa fires on turn_ended, not turn_started — p1 gets no change here
    expect(mp(state, "p1")).toBe(30);
  });

  // ─── Quest Haven ─────────────────────────────────────────────────────────────
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

  // ─── Obby #1 ─────────────────────────────────────────────────────────────────
  it("obby-1 grants +20 on quest_completed for Physical 2+ mosje", () => {
    const entered = enterPlace(baseState(), id("place_obby_1"));
    const fired = appendEvent(entered, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 4
    });
    const notPhysical = appendEvent(entered, {
      type: "quest_completed",
      playerId: "p2",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 4
    });

    expect(mp(fired, "p1")).toBe(50);     // 30 + 20 (Physical 2)
    expect(mp(notPhysical, "p2")).toBe(30); // no trait
  });

  it("obby-1 penalizes -10 on quest_failed for Physical 2+ mosje", () => {
    const entered = enterPlace(baseState(), id("place_obby_1"));
    const fired = appendEvent(entered, {
      type: "quest_failed",
      playerId: "p1",
      questId: id("quest_x"),
      penalty: 0,
      rollResult: 2
    });

    expect(mp(fired, "p1")).toBe(20); // 30 - 10 (Physical 2, failed)
  });

  it("obby-1 ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_obby_1"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(state, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 4
    });

    expect(mp(state, "p1")).toBe(30);
  });

  // ─── Arcade ──────────────────────────────────────────────────────────────────
  it("arcade grants Technical 2+ mosje +15 on quest_completed", () => {
    const entered = enterPlace(baseState(), id("place_arcade"));
    const fired = appendEvent(entered, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 5
    });

    expect(mp(fired, "p1")).toBe(45); // 30 + 15 (Technical 2)
  });

  it("arcade gives no bonus to non-Technical mosje on quest_completed", () => {
    const entered = enterPlace(baseState(), id("place_arcade"));
    const fired = appendEvent(entered, {
      type: "quest_completed",
      playerId: "p2",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 5
    });

    expect(mp(fired, "p2")).toBe(30); // no Technical trait
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
