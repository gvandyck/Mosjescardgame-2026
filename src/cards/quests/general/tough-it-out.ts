import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

export const TOUGH_IT_OUT: QuestDefinition = {
  id: "quest_tough_it_out" as CardId,
  name: "Tough It Out",
  category: "quest",
  subcategory: "RESILIENT",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  roll: {
    die: "d6",
    trait: "Resilient",
    thresholds: { "1": 5, "2": 4, "3": 3 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 80 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 80, isCostPayment: false } }]
};

registerCard(TOUGH_IT_OUT);
