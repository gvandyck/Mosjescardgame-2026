import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { DOUBLE_TRIGGER } from "../../src/cards/piecies/utility/double-trigger.js";
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

const GAIN_20_CARD = {
  id: cardId("gain-20"),
  name: "Gain 20",
  category: "piecie" as const,
  isBoosterOnly: false,
  cost: { type: "free" as const },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "on_play" as const,
  duration: "instant" as const,
  effects: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }]
};

const LOSE_10_GAIN_30_CARD = {
  id: cardId("multi-effect"),
  name: "Multi Effect",
  category: "piecie" as const,
  isBoosterOnly: false,
  cost: { type: "free" as const },
  requirements: [],
  target: "self_active_mosje" as const,
  trigger: "on_play" as const,
  duration: "instant" as const,
  effects: [
    { primitive: "loseMP", params: { target: "$self", amount: 10 } },
    { primitive: "gainMP", params: { target: "$self", amount: 30 } }
  ]
};

function createState(selfMp = 50): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [{ instanceId: "m1", cardId: cardId("card1"), level: 2, mp: selfMp, flags: {} }],
        piecieSlots: ([0, 1, 2, 3, 4] as const).map((slotIndex) => ({
          slotIndex,
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
    effectStack: [],
    eventLog: [],
    rngSeed: 1,
    lastRoll: null
  };
}

beforeEach(() => {
  clearRegistry();
  registerCard(DOUBLE_TRIGGER);
  registerCard(GAIN_20_CARD);
  registerCard(LOSE_10_GAIN_30_CARD);
});

describe("double-trigger wiring", () => {
  it("playing double-trigger applies the buff with usesRemaining:1", () => {
    const state = createState(50);
    const next = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const mosje = next.players[0].mosjes[0];
    expect(mosje.mp).toBe(30); // 50 - 20 cost
    const buff = mosje.flags["buff:double_activate_this_turn"] as { data: { usesRemaining: number } };
    expect(buff.data.usesRemaining).toBe(1);
  });

  it("after double-trigger buff, next card's gainMP fires twice (2× the amount)", () => {
    const state = createState(40);
    // Play double-trigger to apply buff
    const afterTrigger = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // 40 - 20 cost = 20 MP, buff applied

    // Play gain-20 — should gain 20 twice = +40 net
    const afterGain = executeCard(afterTrigger, cardId("gain-20"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(afterGain.players[0].mosjes[0].mp).toBe(60); // 20 + 20 + 20
  });

  it("double-trigger buff is consumed after one use (usesRemaining cleared)", () => {
    const state = createState(40);
    const afterTrigger = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const afterGain = executeCard(afterTrigger, cardId("gain-20"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const mosje = afterGain.players[0].mosjes[0];
    expect(mosje.flags["buff:double_activate_this_turn"]).toBeUndefined();
  });

  it("double_activation_triggered event is emitted on the second run", () => {
    const state = createState(80);
    const afterTrigger = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const afterGain = executeCard(afterTrigger, cardId("gain-20"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const hasDoubleEvent = afterGain.eventLog.some(
      (e) => e.type === "double_activation_triggered"
    );
    expect(hasDoubleEvent).toBe(true);
  });

  it("double-trigger does NOT re-deduct costs", () => {
    const state = createState(50);
    const afterTrigger = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // After double-trigger cost: 50 - 20 = 30 MP, buff applied

    // gain-20 is free, gains 20 twice = +40
    const afterGain = executeCard(afterTrigger, cardId("gain-20"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(afterGain.players[0].mosjes[0].mp).toBe(70); // 30 + 20 + 20, no extra cost deducted
  });

  it("multi-effect card: both effects run twice with double-trigger", () => {
    const state = createState(60);
    const afterTrigger = executeCard(state, cardId("double-trigger"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // 60 - 20 = 40 MP after trigger cost, buff applied

    const afterMulti = executeCard(afterTrigger, cardId("multi-effect"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // Run 1: -10 +30 = net +20 → 40+20 = 60
    // Run 2: -10 +30 = net +20 → 60+20 = 80
    expect(afterMulti.players[0].mosjes[0].mp).toBe(80);
  });
});
