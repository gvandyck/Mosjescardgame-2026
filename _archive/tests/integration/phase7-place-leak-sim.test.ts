import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { registerCard, clearRegistry } from "../../src/cards/registry/card-registry.js";
import {
  THE_GYM,
  SKIFFA,
  THE_VOID,
  SYNERGY_CHAMBER,
  WELLOE_GRAVEYARD,
  QUEST_HAVEN,
  MOMENTUM_STABILIZER,
  BANK_CHILLING
} from "../../src/cards/places/index.js";
import { KEYBOARD } from "../../src/cards/piecies/conditional/keyboard.js";
import { SLECHT_GEZET } from "../../src/cards/piecies/attack/slecht-gezet.js";
import { appendEvent } from "../../src/engine/append-event.js";
import { createGame } from "../../src/engine/create-game.js";
import { enterPlace } from "../../src/engine/place-manager.js";
import { gainMP } from "../../src/effects/mp/gain-mp.js";
import { loseMP } from "../../src/effects/mp/lose-mp.js";
import { sendToWelloe } from "../../src/effects/board/send-to-welloe.js";
import { setMP } from "../../src/effects/mp/set-mp.js";
import { createRng } from "../../src/utils/rng.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function id(value: string): CardId {
  return value as CardId;
}

function baseState(): GameState {
  const created = createGame({
    seed: 444,
    players: [
      {
        id: "p1",
        name: "P1",
        deck: [id("p1_d1"), id("p1_d2"), id("p1_d3")],
        mosjes: [
          { cardId: id("self_main"), startMP: 80 },
          { cardId: id("self_partner"), startMP: 80 }
        ]
      },
      {
        id: "p2",
        name: "P2",
        deck: [id("p2_d1"), id("p2_d2"), id("p2_d3")],
        mosjes: [
          { cardId: id("opp_main"), startMP: 80 },
          { cardId: id("opp_partner"), startMP: 80 }
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
          traits: index === 0 ? { Physical: 3, Social: 2, Technical: 2 } : { Physical: 0, Social: 0, Technical: 0 }
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

function ref(state: GameState, playerId: string) {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) throw new Error("missing player");
  return { playerId, instanceId: player.mosjes[player.activeMosjeIndex].instanceId };
}

function fireTurnCycle(state: GameState, turn: number): GameState {
  let next = appendEvent({ ...state, currentPlayerId: "p1" }, { type: "turn_ended", turn, playerId: "p1" });
  next = appendEvent({ ...next, currentPlayerId: "p2" }, { type: "turn_ended", turn, playerId: "p2" });
  return next;
}

beforeEach(() => {
  clearRegistry();
  [
    THE_GYM,
    SKIFFA,
    THE_VOID,
    SYNERGY_CHAMBER,
    WELLOE_GRAVEYARD,
    QUEST_HAVEN,
    MOMENTUM_STABILIZER,
    BANK_CHILLING,
    KEYBOARD,
    SLECHT_GEZET
  ].forEach((card) => registerCard(card));
});

describe("phase7 place leak simulation", () => {
  it("runs 20-turn swap simulation without ghost listeners or stale active flags", () => {
    let state = baseState();

    state = enterPlace(state, id("place_the_gym"));
    expect(state.activePlace?.cardId).toBe("place_the_gym");
    for (let i = 1; i <= 3; i += 1) {
      state = fireTurnCycle(state, i);
    }

    const gymSegmentStart = state.eventLog.length;
    state = enterPlace(state, id("place_skiffa"));
    expect(state.activePlace?.cardId).toBe("place_skiffa");
    for (let i = 4; i <= 6; i += 1) {
      state = fireTurnCycle(state, i);
    }
    const skiffaSegment = state.eventLog.slice(gymSegmentStart);
    const gymTriggersAfterSwap = skiffaSegment.filter(
      (event) => event.type === "place_trigger_fired" && event.placeCardId === "place_the_gym"
    );
    const skiffaTriggersAfterSwap = skiffaSegment.filter(
      (event) => event.type === "place_trigger_fired" && event.placeCardId === "place_skiffa"
    );
    expect(gymTriggersAfterSwap).toHaveLength(0);
    expect(skiffaTriggersAfterSwap.length).toBeGreaterThan(0);

    state = enterPlace(state, id("place_the_void"));
    expect(state.activePlace?.cardId).toBe("place_the_void");
    const p1 = ref(state, "p1");

    const blockedGain = gainMP(
      state,
      { target: p1, amount: 20 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 7 }
    );
    const blockedLoss = loseMP(
      blockedGain,
      { target: p1, amount: 20, isCostPayment: false },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 7 }
    );
    const costLoss = loseMP(
      blockedLoss,
      { target: p1, amount: 10, isCostPayment: true },
      { source: { kind: "cost" }, actingPlayerId: "p1", rng: createRng(1), turnCount: 7 }
    );
    expect(mp(blockedLoss, "p1")).toBe(mp(state, "p1"));
    expect(mp(costLoss, "p1")).toBe(mp(state, "p1") - 10);

    state = executeCard(costLoss, id("slecht-gezet"), {
      actingPlayerId: "p1",
      actingMosjeRef: ref(costLoss, "p1"),
      targetRef: ref(costLoss, "p2")
    });
    expect(state.activePlace).toBeNull();

    const afterVoidGain = gainMP(
      state,
      { target: ref(state, "p1"), amount: 10 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 8 }
    );
    expect(mp(afterVoidGain, "p1")).toBe(mp(state, "p1") + 10);
    state = afterVoidGain;

    state = enterPlace(state, id("place_synergy_chamber"));
    expect(state.activePlace?.cardId).toBe("place_synergy_chamber");
    const withForcedSynergy = executeCard(state, id("keyboard"), {
      actingPlayerId: "p1",
      actingMosjeRef: ref(state, "p1")
    });
    expect(mp(withForcedSynergy, "p1")).toBe(mp(state, "p1") + 20);

    state = enterPlace(withForcedSynergy, id("place_bank_chilling"));
    const noForcedSynergy = executeCard(state, id("keyboard"), {
      actingPlayerId: "p1",
      actingMosjeRef: ref(state, "p1")
    });
    expect(mp(noForcedSynergy, "p1")).toBe(mp(state, "p1") + 10);
    expect(noForcedSynergy.gameFlags?.synergy_chamber_active).not.toBe(true);
    state = noForcedSynergy;

    state = enterPlace(state, id("place_welloe_graveyard"));
    state = sendToWelloe(
      state,
      { target: ref(state, "p2") },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 13 }
    );
    expect(state.players[1].hand.length).toBeGreaterThan(0);

    state = enterPlace(state, id("place_quest_haven"));
    const beforeQuestBonus = mp(state, "p1");
    state = appendEvent(state, {
      type: "quest_completed",
      playerId: "p1",
      questId: id("quest_x"),
      reward: 0,
      rollResult: 4
    });
    expect(mp(state, "p1")).toBe(beforeQuestBonus + 10);

    state = enterPlace(state, id("place_momentum_stabilizer"));
    const target = ref(state, "p1");
    const blockedSet = setMP(
      state,
      { target, value: 5 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 18 }
    );
    expect(mp(blockedSet, "p1")).toBe(mp(state, "p1"));

    state = enterPlace(blockedSet, id("place_bank_chilling"));
    const allowedSet = setMP(
      state,
      { target: ref(state, "p1"), value: 5 },
      { source: { kind: "card", cardId: id("x") }, actingPlayerId: "p1", rng: createRng(1), turnCount: 19 }
    );
    expect(mp(allowedSet, "p1")).toBe(5);
    expect(allowedSet.activePlace?.cardId).toBe("place_bank_chilling");
    expect(allowedSet.gameFlags?.stabilizer_active).not.toBe(true);
  });
});
