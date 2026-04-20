import { describe, expect, it } from "vitest";
import type { CardDefinition } from "../../src/cards/schema/card-definition.js";
import type { CardId } from "../../src/types/card-id.js";

// Helper to brand a string as CardId without importing the type
function cardId(s: string): CardId {
  return s as CardId;
}

describe("card definition schema (step 1)", () => {
  it("constructs a minimal free piecie card with all required fields", () => {
    const card: CardDefinition = {
      id: cardId("phantom-minimal"),
      name: "Phantom Minimal",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: "instant",
      effects: []
    };

    expect(card.id).toBe("phantom-minimal");
    expect(card.category).toBe("piecie");
    expect(card.cost.type).toBe("free");
    expect(card.effects).toHaveLength(0);
  });

  it("constructs a card with mp cost and trait requirements", () => {
    const card: CardDefinition = {
      id: cardId("phantom-mp-cost"),
      name: "Phantom MP Cost",
      category: "piecie",
      isBoosterOnly: false,
      cost: {
        type: "mp",
        mp: 20,
        traitRequirements: [{ trait: "Social", minStars: 2 }],
        levelRequirement: 2
      },
      requirements: [
        { type: "level", params: { minLevel: 2 } }
      ],
      target: "opponent_active_mosje",
      trigger: "on_activate",
      duration: "this_turn",
      effects: [
        { primitive: "loseMP", params: { amount: 20 } }
      ]
    };

    expect(card.cost.mp).toBe(20);
    expect(card.cost.traitRequirements?.[0]?.trait).toBe("Social");
    expect(card.requirements[0]?.type).toBe("level");
  });

  it("constructs a card with synergies and pet synergies", () => {
    const card: CardDefinition = {
      id: cardId("phantom-synergy"),
      name: "Phantom Synergy",
      category: "mosje",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "none",
      trigger: "passive",
      duration: "while_active",
      effects: [],
      synergies: [
        {
          partnerCardId: cardId("phantom-partner"),
          bonusEffects: [{ primitive: "gainMP", params: { amount: 10 } }]
        }
      ],
      petSynergies: [
        {
          petCardId: cardId("phantom-pet"),
          bonusEffects: [{ primitive: "gainMP", params: { amount: 5 } }]
        }
      ]
    };

    expect(card.synergies).toHaveLength(1);
    expect(card.synergies?.[0]?.partnerCardId).toBe("phantom-partner");
    expect(card.petSynergies?.[0]?.petCardId).toBe("phantom-pet");
  });

  it("constructs a card with optional duration in turns", () => {
    const card: CardDefinition = {
      id: cardId("phantom-turns-duration"),
      name: "Phantom Turns",
      category: "piecie",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "self_active_mosje",
      trigger: "on_play",
      duration: { turns: 3 },
      effects: []
    };

    expect(typeof card.duration).toBe("object");
    expect((card.duration as { turns: number }).turns).toBe(3);
  });

  it("constructs a card with all optional fields", () => {
    const card: CardDefinition = {
      id: cardId("phantom-full"),
      name: "Phantom Full",
      category: "place",
      subcategory: "MOMENTUM-GAINING",
      rarity: "rare",
      flavorText: "A place of great power.",
      isBoosterOnly: true,
      cost: { type: "combo", comboRequirement: "place == bank_chilling" },
      requirements: [
        { type: "place_active", params: { placeCardId: "bank_chilling" } }
      ],
      target: "shared_field",
      trigger: "conditional",
      duration: "once_per_game",
      effects: [
        { primitive: "gainMP", params: { target: "$self", amount: 50 } }
      ]
    };

    expect(card.rarity).toBe("rare");
    expect(card.subcategory).toBe("MOMENTUM-GAINING");
    expect(card.isBoosterOnly).toBe(true);
    expect(card.cost.comboRequirement).toBe("place == bank_chilling");
  });

  it("constructs a quest card with quest_attempt trigger", () => {
    const card: CardDefinition = {
      id: cardId("phantom-quest"),
      name: "Phantom Quest",
      category: "quest",
      isBoosterOnly: false,
      cost: { type: "free" },
      requirements: [],
      target: "required_mosje",
      trigger: "quest_attempt",
      duration: "once_per_game",
      effects: [
        { primitive: "gainMP", params: { target: "$self", amount: 100 } }
      ]
    };

    expect(card.trigger).toBe("quest_attempt");
    expect(card.target).toBe("required_mosje");
  });
});
