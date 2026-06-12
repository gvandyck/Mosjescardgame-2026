import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearRegistry, registerCard } from "../../src/cards/registry/index.js";
import { executeCard } from "../../src/cards/executor/execute-card.js";
import { resolveTargetReference, MissingTargetError } from "../../src/cards/executor/resolve-target-reference.js";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardInvocation } from "../../src/cards/executor/execute-card.js";
import type { GameState } from "../../src/types/game-state.js";
import type { CardId } from "../../src/types/card-id.js";

function cardId(s: string): CardId {
  return s as CardId;
}

function createState(): GameState {
  return {
    turnCount: 1,
    currentPlayerId: "p1",
    currentPhase: "main",
    players: [
      {
        id: "p1",
        name: "P1",
        mosjes: [
          { instanceId: "m1", cardId: cardId("mosje_a"), level: 1, mp: 50, flags: {} },
          { instanceId: "m2", cardId: cardId("mosje_b"), level: 1, mp: 20, flags: {} }
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
    rngSeed: 7,
    lastRoll: null
  };
}

const p1Inv: CardInvocation = {
  actingPlayerId: "p1",
  actingMosjeRef: { playerId: "p1", instanceId: "m1" }
};

describe("executor branch coverage (step 3 supplement)", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  describe("runEffects error catch branch", () => {
    it("emits effect_execution_failed warning when primitive throws and continues returning state", () => {
      // unknownPrimitive is not in the registry â†’ resolvePrimitive throws UnknownPrimitiveError
      // The runEffects catch block should swallow it and emit a warning
      const card: CardDefinition = {
        id: cardId("exec-throws"),
        name: "Exec Throws",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [
          { primitive: "gainMP", params: { target: "$self", amount: 10 } },
          { primitive: "unknownPrimitiveThatThrows", params: {} }
        ]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-throws"), p1Inv);

      // First effect ran (gainMP): 50 + 10 = 60
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);

      // Warning event was emitted for the failure
      const warningEvent = next.eventLog.find(
        (e) => e.type === "warning" && (e as { code: string }).code === "effect_execution_failed"
      );
      expect(warningEvent).toBeDefined();

      // card_resolved still emitted
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    });
  });

  describe("pet synergy branch", () => {
    it("fires pet synergy bonus when pet is face-up in a slot", () => {
      const stateWithPet: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                piecieSlots: p.piecieSlots.map((slot) =>
                  slot.slotIndex !== 0
                    ? slot
                    : { ...slot, cardId: cardId("phantom-pet"), faceUp: true }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-pet-synergy"),
        name: "Exec Pet Synergy",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        petSynergies: [
          {
            petCardId: cardId("phantom-pet"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(stateWithPet, cardId("exec-pet-synergy"), p1Inv);
      // 50 + 10 (main) + 5 (pet synergy) = 65
      expect(next.players[0]?.mosjes[0]?.mp).toBe(65);
    });

    it("does NOT fire pet synergy when pet is face-down", () => {
      // piecieSlot has cardId but faceUp=false
      const stateWithFaceDownPet: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                piecieSlots: p.piecieSlots.map((slot) =>
                  slot.slotIndex !== 0
                    ? slot
                    : { ...slot, cardId: cardId("phantom-pet"), faceUp: false }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-pet-facedown"),
        name: "Exec Pet Face Down",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }],
        petSynergies: [
          {
            petCardId: cardId("phantom-pet"),
            bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
          }
        ]
      };
      registerCard(card);

      const next = executeCard(stateWithFaceDownPet, cardId("exec-pet-facedown"), p1Inv);
      // 50 + 10 only (no pet synergy)
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });
  });

  describe("resolveTargetReference edge cases", () => {
    it("returns self for 'none' target", () => {
      const state = createState();
      const target = resolveTargetReference(state, "none", p1Inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("returns targetRef for 'self_or_ally_mosje' when targetRef provided", () => {
      const inv: CardInvocation = {
        ...p1Inv,
        targetRef: { playerId: "p1", instanceId: "m2" }
      };
      const state = createState();
      const target = resolveTargetReference(state, "self_or_ally_mosje", inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m2" });
    });

    it("falls back to actingMosjeRef for 'self_or_ally_mosje' when targetRef absent", () => {
      const state = createState();
      const target = resolveTargetReference(state, "self_or_ally_mosje", p1Inv);
      expect(target).toEqual({ playerId: "p1", instanceId: "m1" });
    });

    it("returns undefined for multi-target 'all_opponents'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "all_opponents", p1Inv);
      expect(target).toBeUndefined();
    });

    it("returns undefined for 'all_mosjes'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "all_mosjes", p1Inv);
      expect(target).toBeUndefined();
    });

    it("returns undefined for 'shared_field'", () => {
      const state = createState();
      const target = resolveTargetReference(state, "shared_field", p1Inv);
      expect(target).toBeUndefined();
    });

    it("throws MissingTargetError for 'any_mosje' without targetRef", () => {
      const state = createState();
      expect(() => resolveTargetReference(state, "any_mosje", p1Inv)).toThrow(MissingTargetError);
    });

    it("throws MissingTargetError for 'required_mosje' without targetRef", () => {
      const state = createState();
      expect(() => resolveTargetReference(state, "required_mosje", p1Inv)).toThrow(MissingTargetError);
    });
  });

  describe("requirement type coverage", () => {
    it("evaluates 'trait' requirement correctly when met", () => {
      const stateWithTrait: GameState = {
        ...createState(),
        players: createState().players.map((p) =>
          p.id !== "p1"
            ? p
            : {
                ...p,
                mosjes: p.mosjes.map((m) =>
                  m.instanceId !== "m1" ? m : { ...m, flags: { traits: { Social: 3 } } }
                )
              }
        )
      };

      const card: CardDefinition = {
        id: cardId("exec-trait-req"),
        name: "Exec Trait Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "trait", params: { trait: "Social", minStars: 2 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      const next = executeCard(stateWithTrait, cardId("exec-trait-req"), p1Inv);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });

    it("evaluates 'mp' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-mp-req"),
        name: "Exec MP Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "mp", params: { operator: ">=", value: 30 } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // p1/m1 has 50 MP >= 30 â†’ passes
      const next = executeCard(createState(), cardId("exec-mp-req"), p1Inv);
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });

    it("evaluates 'card_in_play' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-card-type-req"),
        name: "Exec Card Type Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "card_in_play", params: { cardType: "dragon" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // No dragon in play â†’ rejected
      const next = executeCard(createState(), cardId("exec-card-type-req"), p1Inv);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });

    it("evaluates 'place_active' requirement", () => {
      const card: CardDefinition = {
        id: cardId("exec-place-req"),
        name: "Exec Place Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "place_active", params: { placeCardId: "special_bank" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      // No active place â†’ rejected
      const next = executeCard(createState(), cardId("exec-place-req"), p1Inv);
      expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
    });

    it("evaluates 'custom' requirement as always passing", () => {
      const card: CardDefinition = {
        id: cardId("exec-custom-req"),
        name: "Exec Custom Req",
        category: "piecie",
        isBoosterOnly: false,
        cost: { type: "free" },
        requirements: [{ type: "custom", params: { checkName: "mySpecialCheck" } }],
        target: "self_active_mosje",
        trigger: "on_play",
        duration: "instant",
        effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
      };
      registerCard(card);

      const next = executeCard(createState(), cardId("exec-custom-req"), p1Inv);
      // custom always passes â†’ effect runs
      expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
    });
  });
});

describe("execute-card branch coverage â€“ next_piecie_free buff", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("uses free activation (no MP deducted) and clears buff when usesRemaining reaches 0", () => {
    const stateWithBuff: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : {
                      ...m,
                      mp: 50,
                      flags: {
                        "buff:next_piecie_free": {
                          data: { usesRemaining: 1 },
                          expiryTurn: 999
                        }
                      }
                    }
              )
            }
      )
    };

    const mpCard: CardDefinition = {
      id: cardId("free-buff-card"),
      name: "Free Buff Card",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 20 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(mpCard);

    const next = executeCard(stateWithBuff, cardId("free-buff-card"), p1Inv);

    // Free activation: 20 MP cost NOT deducted; gainMP +5 â†’ 50 + 5 = 55
    expect(next.players[0]?.mosjes[0]?.mp).toBe(55);
    // buff consumed (usesRemaining 1 â†’ 0 â†’ deleted)
    expect(next.players[0]?.mosjes[0]?.flags["buff:next_piecie_free"]).toBeUndefined();
  });

  it("keeps buff and decrements usesRemaining when it was 2", () => {
    const stateWithBuff: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : {
                      ...m,
                      mp: 50,
                      flags: {
                        "buff:next_piecie_free": {
                          data: { usesRemaining: 2 },
                          expiryTurn: 999
                        }
                      }
                    }
              )
            }
      )
    };

    const mpCard2: CardDefinition = {
      id: cardId("free-buff-card-2"),
      name: "Free Buff Card 2",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "mp", mp: 20 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 3 } }]
    };
    registerCard(mpCard2);

    const next = executeCard(stateWithBuff, cardId("free-buff-card-2"), p1Inv);

    // Free activation: cost not deducted, gainMP +3 â†’ 53
    expect(next.players[0]?.mosjes[0]?.mp).toBe(53);
    // Buff remains with usesRemaining: 1
    const buff = next.players[0]?.mosjes[0]?.flags["buff:next_piecie_free"] as
      | { data: { usesRemaining: number } }
      | undefined;
    expect(buff?.data?.usesRemaining).toBe(1);
  });
});

describe("execute-card branch coverage â€“ double-activation synergy re-run", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("re-runs synergy bonusEffects on the second activation when partner is on field", () => {
    const stateWithDouble: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: [
                {
                  instanceId: "m1",
                  cardId: cardId("mosje_a"),
                  level: 1,
                  mp: 50,
                  flags: {
                    "buff:double_activate_this_turn": {
                      data: { usesRemaining: 1 }
                    }
                  }
                },
                { instanceId: "m2", cardId: cardId("synergy-partner"), level: 1, mp: 20, flags: {} }
              ]
            }
      )
    };

    const synergyCard: CardDefinition = {
      id: cardId("double-synergy-card"),
      name: "Double Synergy Card",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }],
      synergies: [
        {
          partnerCardId: cardId("synergy-partner"),
          bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
        }
      ]
    };
    registerCard(synergyCard);

    const next = executeCard(stateWithDouble, cardId("double-synergy-card"), p1Inv);

    // Run 1: main +5 + synergy +10 = +15 â†’ 50 + 15 = 65
    // Run 2 (double): main +5 + synergy +10 = +15 â†’ 65 + 15 = 80
    expect(next.players[0]?.mosjes[0]?.mp).toBe(80);
    expect(next.eventLog.some((e) => e.type === "double_activation_triggered")).toBe(true);
  });
});

describe("execute-card branch coverage – double-activate buff usesRemaining decrement", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("keeps double_activate buff with usesRemaining:1 after decrement from 2", () => {
    const stateWithDouble2: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: [
                {
                  instanceId: "m1",
                  cardId: cardId("mosje_a"),
                  level: 1,
                  mp: 50,
                  flags: {
                    "buff:double_activate_this_turn": {
                      data: { usesRemaining: 2 }
                    }
                  }
                },
                { instanceId: "m2", cardId: cardId("dbl-partner"), level: 1, mp: 20, flags: {} }
              ]
            }
      )
    };

    const simpleCard: CardDefinition = {
      id: cardId("simple-double-card"),
      name: "Simple Double Card",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 2 } }]
    };
    registerCard(simpleCard);

    const next = executeCard(stateWithDouble2, cardId("simple-double-card"), p1Inv);

    // Effect runs twice: +2 + +2 = +4 → 50 + 4 = 54
    expect(next.players[0]?.mosjes[0]?.mp).toBe(54);
    // Buff remains with usesRemaining: 1 (decremented from 2, not cleared)
    const buff = next.players[0]?.mosjes[0]?.flags["buff:double_activate_this_turn"] as
      | { data: { usesRemaining: number } }
      | undefined;
    expect(buff?.data?.usesRemaining).toBe(1);
  });
});

describe("execute-card branch coverage – meetsCostGates and isRestoreLocked", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("rejects when levelRequirement cost gate is not met", () => {
    const card: CardDefinition = {
      id: cardId("cost-gate-level"),
      name: "Cost Gate Level",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free", levelRequirement: 3 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(card);

    // m1 is level 1, levelRequirement is 3 → rejected
    const next = executeCard(createState(), cardId("cost-gate-level"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("passes when levelRequirement cost gate is met", () => {
    const card: CardDefinition = {
      id: cardId("cost-gate-level-ok"),
      name: "Cost Gate Level OK",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free", levelRequirement: 1 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(card);

    // m1 is level 1 >= 1 → passes
    const next = executeCard(createState(), cardId("cost-gate-level-ok"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });

  it("rejects when traitRequirements cost gate is not met", () => {
    const card: CardDefinition = {
      id: cardId("cost-gate-trait"),
      name: "Cost Gate Trait",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free", traitRequirements: [{ trait: "Creative", minStars: 3 }] },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(card);

    // m1 has no traits → rejected
    const next = executeCard(createState(), cardId("cost-gate-trait"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("rejects when isRestoreLocked buff is active and card contains gainMP", () => {
    const stateWithLock: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1"
                  ? m
                  : { ...m, flags: { "buff:piecie_mp_restore_locked": true } }
              )
            }
      )
    };

    const gainCard: CardDefinition = {
      id: cardId("gain-restore-locked"),
      name: "Gain Restore Locked",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    };
    registerCard(gainCard);

    const next = executeCard(stateWithLock, cardId("gain-restore-locked"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("allows gainMP when restore lock buff is absent", () => {
    const gainCard2: CardDefinition = {
      id: cardId("gain-no-lock"),
      name: "Gain No Lock",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    };
    registerCard(gainCard2);

    const next = executeCard(createState(), cardId("gain-no-lock"), p1Inv);
    expect(next.players[0]?.mosjes[0]?.mp).toBe(60);
  });
});

describe("execute-card branch coverage – discard cost error paths", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  function makeDiscardCard(id: string): CardDefinition {
    return {
      id: cardId(id),
      name: `Discard Cost Card ${id}`,
      category: "piecie" as const,
      isBoosterOnly: false,
      cost: { type: "discard" as const, discardCount: 1 },
      requirements: [],
      target: "self_active_mosje" as const,
      trigger: "on_play" as const,
      duration: "instant" as const,
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
  }

  it("rejects when playerChoices is absent (MissingChoiceError)", () => {
    const card = makeDiscardCard("discard-no-choice");
    registerCard(card);

    const stateWithHand: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, hand: [cardId("c1")] }
      )
    };

    const next = executeCard(stateWithHand, cardId("discard-no-choice"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("rejects when chosen discard card is not in hand (InvalidChoiceError)", () => {
    const card = makeDiscardCard("discard-wrong-choice");
    registerCard(card);

    const stateWithHand: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, hand: [cardId("c1")] }
      )
    };

    const next = executeCard(stateWithHand, cardId("discard-wrong-choice"), {
      ...p1Inv,
      playerChoices: { discardCardId: "not-in-hand" }
    });
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("succeeds when chosen discard card is in hand", () => {
    const card = makeDiscardCard("discard-happy-path");
    registerCard(card);

    const stateWithHand: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, hand: [cardId("c1")] }
      )
    };

    const next = executeCard(stateWithHand, cardId("discard-happy-path"), {
      ...p1Inv,
      playerChoices: { discardCardId: "c1" }
    });
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
    expect(next.players[0]?.hand).toHaveLength(0);
    expect(next.players[0]?.discard).toContain(cardId("c1"));
  });
});

describe("execute-card branch coverage – variable cost fallback", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("treats unknown variable resolver as free cost", () => {
    const card: CardDefinition = {
      id: cardId("var-cost-fallback"),
      name: "Variable Cost Fallback",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "variable", resolver: "does_not_exist" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(card);

    const next = executeCard(createState(), cardId("var-cost-fallback"), p1Inv);

    // Unknown resolver falls back to free, so only effect gain applies.
    expect(next.players[0]?.mosjes[0]?.mp).toBe(55);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });
});

describe("execute-card branch coverage – discard catch rethrow", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("rethrows non-choice errors from discard cost handling", () => {
    const card: CardDefinition = {
      id: cardId("discard-rethrow"),
      name: "Discard Rethrow",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "discard", discardCount: 1 },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(card);

    const stateWithHand: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1" ? p : { ...p, hand: [cardId("c1")] }
      )
    };

    // Getter throws a generic Error during payDiscardCost before its own typed checks.
    const invocation = {
      ...p1Inv,
      get playerChoices(): Readonly<Record<string, unknown>> {
        throw new Error("boom");
      }
    } as unknown as CardInvocation;

    expect(() => executeCard(stateWithHand, cardId("discard-rethrow"), invocation)).toThrow("boom");
  });
});

describe("execute-card branch coverage – remaining branch probes", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("isRestoreLocked detects nested gainMP primitive via recursive scan", () => {
    const stateWithLock: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1" ? m : { ...m, flags: { "buff:piecie_mp_restore_locked": true } }
              )
            }
      )
    };

    const nestedGainCard: CardDefinition = {
      id: cardId("nested-gain-lock"),
      name: "Nested Gain Lock",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [
        {
          primitive: "ifThenElse",
          params: {
            condition: { primitive: "checkMP", params: { target: "$self", operator: ">=", value: 0 } },
            then: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }],
            else: []
          }
        }
      ]
    };
    registerCard(nestedGainCard);

    const next = executeCard(stateWithLock, cardId("nested-gain-lock"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "rejected" });
  });

  it("passes traitRequirements gate when required trait stars are present", () => {
    const stateWithTrait: GameState = {
      ...createState(),
      players: createState().players.map((p) =>
        p.id !== "p1"
          ? p
          : {
              ...p,
              mosjes: p.mosjes.map((m) =>
                m.instanceId !== "m1" ? m : { ...m, flags: { traits: { Creative: 3 } } }
              )
            }
      )
    };

    const traitGateCard: CardDefinition = {
      id: cardId("cost-gate-trait-ok"),
      name: "Cost Gate Trait OK",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free", traitRequirements: [{ trait: "Creative", minStars: 3 }] },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(traitGateCard);

    const next = executeCard(stateWithTrait, cardId("cost-gate-trait-ok"), p1Inv);
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });

  it("uses known variable resolver path and applies resolved mp cost", () => {
    const resolverCard: CardDefinition = {
      id: cardId("var-cost-known"),
      name: "Variable Cost Known",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "variable", resolver: "blensen_cost" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    };
    registerCard(resolverCard);

    // No Jensen/Frenssen in this turn's log => resolver returns mp:50.
    // Starting at 50 MP means pay 50 then gain 5 => 5.
    const next = executeCard(createState(), cardId("var-cost-known"), p1Inv);
    expect(next.players[0]?.mosjes[0]?.mp).toBe(5);
  });
});

describe("execute-card branch coverage – validateRequirement default", () => {
  beforeEach(() => clearRegistry());
  afterEach(() => clearRegistry());

  it("executes default switch branch for unknown requirement type via runtime-cast input", () => {
    const weirdReqCard = {
      id: cardId("weird-req"),
      name: "Weird Requirement",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [{ type: "unknown_runtime_only", params: {} }],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: [{ primitive: "gainMP", params: { target: "$self", amount: 1 } }]
    } as unknown as CardDefinition;
    registerCard(weirdReqCard);

    const next = executeCard(createState(), cardId("weird-req"), p1Inv);
    // Runtime behavior of default branch returns req.type string (truthy), so it passes.
    expect(next.eventLog.at(-1)).toMatchObject({ type: "card_resolved", outcome: "success" });
  });
});
