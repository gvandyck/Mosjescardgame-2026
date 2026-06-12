import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

export const QUICK_THINKING: QuestDefinition = {
  id: "quest_quick_thinking" as CardId,
  name: "Quick Thinking",
  category: "quest",
  subcategory: "MENTAL",
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
    trait: "Mental",
    thresholds: { "1": 5, "2": 4, "3": 3 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(QUICK_THINKING);
