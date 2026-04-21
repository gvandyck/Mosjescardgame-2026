import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../../src/cards/executor/execute-card.js";
import { clearRegistry, registerCard } from "../../../src/cards/registry/card-registry.js";
import { KEYBOARD } from "../../../src/cards/piecies/conditional/keyboard.js";
import { COERTS_CARAVAN } from "../../../src/cards/places/coerts-caravan.js";
import { WELLOE_GRAVEYARD } from "../../../src/cards/places/welloe-graveyard.js";
import { MOMENTUM_STABILIZER } from "../../../src/cards/places/momentum-stabilizer.js";
import { SYNERGY_CHAMBER } from "../../../src/cards/places/synergy-chamber.js";
import { SKIFFA } from "../../../src/cards/places/skiffa.js";
import { appendEvent } from "../../../src/engine/append-event.js";
import { createGame } from "../../../src/engine/create-game.js";
import { enterPlace } from "../../../src/engine/place-manager.js";
import { sendToWelloe } from "../../../src/effects/board/send-to-welloe.js";
import { setGameFlag } from "../../../src/effects/board/set-game-flag.js";
import { setMP } from "../../../src/effects/mp/set-mp.js";
import { createRng } from "../../../src/utils/rng.js";
import type { CardId } from "../../../src/types/card-id.js";
import type { GameState } from "../../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  const created = createGame({
    seed: 111,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("p1_d1"), id("p1_d2")],
        mosjes: [
          { cardId: id("self_main"), startMP: 50 },
          { cardId: id("ally"), startMP: 50 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("p2_d1"), id("p2_d2")],
        mosjes: [
          { cardId: id("opp_main"), startMP: 50 },
          { cardId: id("opp_partner"), startMP: 50 }
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
          traits: index === 0 ? { Technical: 2 } : { Technical: 0 }
        }
      }))
    }))
  };
}

function ref(state: GameState, playerId: string) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return { playerId, instanceId: player.mosjes[player.activeMosjeIndex].instanceId };
}

function mp(state: GameState, playerId: string): number {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return player.mosjes[player.activeMosjeIndex].mp;
}

beforeEach(() => {
  clearRegistry();
  registerCard(COERTS_CARAVAN);
  registerCard(WELLOE_GRAVEYARD);
  registerCard(MOMENTUM_STABILIZER);
  registerCard(SYNERGY_CHAMBER);
  registerCard(SKIFFA);
  registerCard(KEYBOARD);
});

describe("step3 places", () => {
  it("coerts-caravan gives +20 to technical 2+ and +10 otherwise at turn_start", () => {
    const entered = enterPlace(baseState(), id("place_coerts_caravan"));
    const p1 = appendEvent(
      { ...entered, currentPlayerId: "p1" },
      { type: "turn_started", turn: 1, playerId: "p1" }
    );
    const p2 = appendEvent(
      { ...entered, currentPlayerId: "p2" },
      { type: "turn_started", turn: 1, playerId: "p2" }
    );

    expect(mp(p1, "p1")).toBe(70);
    expect(mp(p2, "p2")).toBe(60);
  });

  it("coerts-caravan ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_coerts_caravan"));
    state = enterPlace(state, id("place_skiffa"));
    state = appendEvent(
      { ...state, currentPlayerId: "p1" },
      { type: "turn_started", turn: 1, playerId: "p1" }
    );

    expect(mp(state, "p1")).toBe(50);
  });

  it("welloe-graveyard grants +20 and draw 1 to defeated mosje owner", () => {
    let state = enterPlace(baseState(), id("place_welloe_graveyard"));
    state = sendToWelloe(
      state,
      { target: ref(state, "p2") },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 1 }
    );

    expect(mp(state, "p2")).toBe(-979);
    expect(state.players[1].hand).toHaveLength(1);
  });

  it("welloe-graveyard ghost listener stops after replacement", () => {
    let state = enterPlace(baseState(), id("place_welloe_graveyard"));
    state = enterPlace(state, id("place_skiffa"));
    state = sendToWelloe(
      state,
      { target: ref(state, "p2") },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 1 }
    );

    expect(state.players[1].hand).toHaveLength(0);
  });

  it("momentum-stabilizer blocks setMP while active and allows after replacement", () => {
    let state = enterPlace(baseState(), id("place_momentum_stabilizer"));
    const target = ref(state, "p1");

    const blocked = setMP(
      state,
      { target, value: 5 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 1 }
    );
    state = enterPlace(state, id("place_skiffa"));
    const allowed = setMP(
      state,
      { target, value: 5 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 1 }
    );

    expect(blocked.players[0].mosjes[0].mp).toBe(50);
    expect(allowed.players[0].mosjes[0].mp).toBe(5);
  });

  it("synergy-chamber enables synergy without partner and reverts after replacement", () => {
    const invocation = {
      actingPlayerId: "p1",
      actingMosjeRef: ref(baseState(), "p1")
    };
    const noChamber = executeCard(baseState(), id("keyboard"), invocation);

    let withChamber = enterPlace(baseState(), id("place_synergy_chamber"));
    withChamber = executeCard(withChamber, id("keyboard"), {
      actingPlayerId: "p1",
      actingMosjeRef: ref(withChamber, "p1")
    });

    const afterExit = executeCard(enterPlace(baseState(), id("place_skiffa")), id("keyboard"), {
      actingPlayerId: "p1",
      actingMosjeRef: ref(baseState(), "p1")
    });

    expect(mp(noChamber, "p1")).toBe(60);
    expect(mp(withChamber, "p1")).toBe(70);
    expect(mp(afterExit, "p1")).toBe(60);
  });

  it("setGameFlag round trip sets and clears state flags", () => {
    const set = setGameFlag(baseState(), { flag: "test_flag", value: true }, {
      source: { kind: "ability" },
      actingPlayerId: "p1",
      rng: createRng(1),
      turnCount: 1
    });
    const cleared = setGameFlag(set, { flag: "test_flag", value: false }, {
      source: { kind: "ability" },
      actingPlayerId: "p1",
      rng: createRng(1),
      turnCount: 1
    });

    expect(set.gameFlags?.test_flag).toBe(true);
    expect(cleared.gameFlags?.test_flag).toBe(false);
  });
});
