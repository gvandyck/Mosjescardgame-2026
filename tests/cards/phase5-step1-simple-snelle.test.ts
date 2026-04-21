import { beforeEach, describe, expect, it } from "vitest";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import "../../src/cards/snelle-piecies/index.js"; // register all Step 1 snelle cards
import { clearRegistry, registerCard } from "../../src/cards/registry/card-registry.js";
import type { CardId } from "../../src/types/card-id.js";
import type { GameState } from "../../src/types/game-state.js";

function cardId(value: string): CardId {
  return value as CardId;
}

function createState(overrides: { selfMp?: number; level?: number; traits?: Record<string, number> } = {}): GameState {
  return {
    turnCount: 5,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          {
            instanceId: "m1",
            cardId: cardId("c1"),
            level: (overrides.level ?? 2) as 2 | 3,
            mp: overrides.selfMp ?? 50,
            flags: overrides.traits !== undefined ? { traits: overrides.traits } : {}
          }
        ],
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
    rngSeed: 42,
    lastRoll: null};
}

beforeEach(() => {
  clearRegistry();
  // Re-importing registers all cards
});

// ── ff-haaltje-nemen ─────────────────────────────────────────────────────────

describe("ff-haaltje-nemen", () => {
  beforeEach(() => {
    // cards are registered at import time via registerCard, but clearRegistry removes them
    // so we re-import; since modules are cached, registerCard is NOT re-called automatically.
    // We register inline instead.
    registerCard({
      id: cardId("snelle_ff_haaltje_nemen"),
      name: "FF Haaltje Nemen",
      category: "snelle-piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { condition: "checkTrait", params: { target: "$self", trait: "Resilient", minStars: 2 } },
            then: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 30, duration: 1 } },
            else: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 20, duration: 1 } }
          }
        }
      ]
    });
  });

  it("applies mp-loss-reduction buff (base: 20) without Resilient ★★", () => {
    const state = createState({ selfMp: 50 });
    const next = executeCard(state, cardId("snelle_ff_haaltje_nemen"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const buff = next.players[0].mosjes[0].flags["buff:mp-loss-reduction"] as
      | { data?: { amount?: number } }
      | undefined;
    expect(buff?.data?.amount).toBe(20);
  });

  it("applies 30 reduction when Resilient ★★ or higher", () => {
    const state = createState({ traits: { Resilient: 2 } });
    const next = executeCard(state, cardId("snelle_ff_haaltje_nemen"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const buff = next.players[0].mosjes[0].flags["buff:mp-loss-reduction"] as
      | { data?: { amount?: number } }
      | undefined;
    expect(buff?.data?.amount).toBe(30);
  });
});

// ── emergency-healings ────────────────────────────────────────────────────────

describe("emergency-healings", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_emergency_healings"),
      name: "Emergency Healings",
      category: "snelle-piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 10 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { condition: "checkTrait", params: { target: "$self", trait: "Resilient", minStars: 2 } },
            then: { primitive: "gainMP", params: { target: "$self", amount: 35 } },
            else: { primitive: "gainMP", params: { target: "$self", amount: 25 } }
          }
        }
      ]
    });
  });

  it("restores 25 MP (base) and costs 10 MP", () => {
    const state = createState({ selfMp: 30 });
    const next = executeCard(state, cardId("snelle_emergency_healings"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // 30 - 10 cost + 25 heal = 45
    expect(next.players[0].mosjes[0].mp).toBe(45);
  });

  it("restores 35 MP with Resilient ★★", () => {
    const state = createState({ selfMp: 30, traits: { Resilient: 2 } });
    const next = executeCard(state, cardId("snelle_emergency_healings"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // 30 - 10 + 35 = 55
    expect(next.players[0].mosjes[0].mp).toBe(55);
  });
});

// ── lucky-coin ────────────────────────────────────────────────────────────────

describe("lucky-coin", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_lucky_coin"),
      name: "Lucky Cóin",
      category: "snelle-piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 10 },
      requirements: [{ type: "trait", params: { trait: "Creative", minStars: 1 } }],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { condition: "checkTrait", params: { target: "$self", trait: "Creative", minStars: 3 } },
            then: { primitive: "chooseDieResult", params: { chosenValue: 6 } },
            else: { primitive: "rerollDie", params: {} }
          }
        }
      ]
    });
  });

  it("with Creative ★★★ sets lastRoll.final to 6", () => {
    const state = {
      ...createState({ traits: { Creative: 3 } }),
      lastRoll: { raw: 2, modifier: 0, final: 2, rollerId: "p1" }
    };
    const next = executeCard(state, cardId("snelle_lucky_coin"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.lastRoll?.final).toBe(6);
  });

  it("without Creative ★★★ rerolls the die (result changes)", () => {
    const state = {
      ...createState({ traits: { Creative: 1 } }),
      lastRoll: { raw: 1, modifier: 0, final: 1, rollerId: "p1" }
    };
    const next = executeCard(state, cardId("snelle_lucky_coin"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // A die_rerolled event should be in the log
    const rerolled = next.eventLog.some((e) => e.type === "die_rerolled");
    expect(rerolled).toBe(true);
  });
});

// ── bijna-welloe ─────────────────────────────────────────────────────────────

describe("bijna-welloe", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_bijna_welloe"),
      name: "Bijna Welloe",
      category: "snelle-piecie",
      requiresStackTarget: true,
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
        {
          primitive: "ifThenElse",
          params: {
            condition: { condition: "checkTrait", params: { target: "$self", trait: "Resilient", minStars: 3 } },
            then: { primitive: "setMP", params: { target: "$self", value: 15 } },
            else: { primitive: "setMP", params: { target: "$self", value: 5 } }
          }
        }
      ]
    });
  });

  it("sets MP to 5 when played (base, no Resilient ★★★)", () => {
    const state = createState({ selfMp: 1 });
    const next = executeCard(state, cardId("snelle_bijna_welloe"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(5);
  });

  it("sets MP to 15 with Resilient ★★★", () => {
    const state = createState({ selfMp: 1, traits: { Resilient: 3 } });
    const next = executeCard(state, cardId("snelle_bijna_welloe"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(15);
  });
});

// ── not-today ─────────────────────────────────────────────────────────────────

describe("not-today (negate_elimination)", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_negate_elimination"),
      name: "Not Today",
      category: "snelle-piecie",
      requiresStackTarget: true,
      isBoosterOnly: false,
      cost: { type: "mp", mp: 20 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } }
      ]
    });
  });

  it("emits no event if no pending effect to negate (empty $pendingEffectId)", () => {
    const state = createState({ selfMp: 40 });
    const next = executeCard(state, cardId("snelle_negate_elimination"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // negateEffect with empty id is a no-op (effect not found in stack)
    expect(next.players[0].mosjes[0].mp).toBe(20); // 40 - 20 cost
  });
});

// ── je-weet-niet ─────────────────────────────────────────────────────────────

describe("je-weet-niet", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_jeweetniet"),
      name: "Jeweetniet wie Ikben",
      category: "snelle-piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 10 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        {
          primitive: "applyBuff",
          params: {
            target: "$self",
            buffId: "mp_loss_immune",
            data: { immune: true },
            expiryTurn: "$currentTurn + 2"
          }
        }
      ]
    });
  });

  it("applies mp_loss_immune buff", () => {
    const state = createState({ selfMp: 30 });
    const next = executeCard(state, cardId("snelle_jeweetniet"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    const buff = next.players[0].mosjes[0].flags["buff:mp_loss_immune"] as
      | { data?: { immune?: boolean } }
      | undefined;
    expect(buff?.data?.immune).toBe(true);
  });
});

// ── sleutelpuntje ─────────────────────────────────────────────────────────────

describe("sleutelpuntje", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_sleutelpuntje"),
      name: "Sleutelpuntje",
      category: "snelle-piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 5 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        {
          primitive: "choose",
          params: {
            chooserId: "$player",
            options: [
              { primitive: "gainMP", params: { target: "$self", amount: 15 } },
              { primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }
            ],
            resolver: (_chooserId: string, _options: unknown[], _state: unknown, _ctx: unknown) => 0
          }
        }
      ]
    });
  });

  it("with resolver selecting +15: costs 5 MP, gains 15 MP", () => {
    const state = createState({ selfMp: 50 });
    const next = executeCard(state, cardId("snelle_sleutelpuntje"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    // 50 - 5 cost + 15 gain = 60
    expect(next.players[0].mosjes[0].mp).toBe(60);
  });
});

// ── jensen ───────────────────────────────────────────────────────────────────

describe("jensen", () => {
  beforeEach(() => {
    registerCard({
      id: cardId("snelle_jensen"),
      name: "Jensen!",
      category: "snelle-piecie",
      requiresStackTarget: true,
      isBoosterOnly: false,
      cost: { type: "mp", mp: 10 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "instant",
      duration: "instant",
      effects: [
        { primitive: "negateEffect", params: { pendingEffectId: "$pendingEffectId" } },
        { primitive: "discardSourceCard", params: { pendingEffectId: "$pendingEffectId" } }
      ]
    });
  });

  it("deducts 10 MP cost on play", () => {
    const state = createState({ selfMp: 50 });
    const next = executeCard(state, cardId("snelle_jensen"), {
      actingPlayerId: "p1",
      actingMosjeRef: { playerId: "p1", instanceId: "m1" }
    });
    expect(next.players[0].mosjes[0].mp).toBe(40); // 50 - 10
  });
});


