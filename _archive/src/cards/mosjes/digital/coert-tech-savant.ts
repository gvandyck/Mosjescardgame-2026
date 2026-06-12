import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const COERT_TECH_SAVANT: MosjeDefinition = {
  id: "coert-tech-savant" as CardId,
  name: "Coert The Hawaiian Tech Savant",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 0, Mental: 2, Social: 1, Creative: 0, Technical: 3, Resilient: 0 },
  startMP: 10,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "mp", mp: 10 },
    usageLimit: "unlimited",
    description: "Extra Resources: pay 10 MP to draw 1 additional card. Repeatable as long as MP allows.",
    effects: [
      { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "binti-the-sharp-tongue" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    },
    {
      partnerCardId: "binti-the-creator" as CardId,
      description: "Gain double MP from all FOOD-tagged Piecies.",
      bonusEffects: []
    }
  ]
};

registerCard(COERT_TECH_SAVANT);
