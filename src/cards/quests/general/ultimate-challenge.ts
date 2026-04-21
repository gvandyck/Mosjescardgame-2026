import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Any trait at ★★★ AND pay 30 MP." 30 MP cost embedded in both outcomes.
// "Any trait at ★★★" requires checking multiple traits — simplified to custom req.
// Flagged in phase6-questions.md.
export const ULTIMATE_CHALLENGE: QuestDefinition = {
  id: "quest_ultimate_challenge" as CardId,
  name: "Ultimate Challenge",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [
    { type: "mp", params: { operator: ">=", value: 30 } },
    { type: "custom", params: { desc: "Any trait at ★★★" } }
  ],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { desc: "Any trait at ★★★" } },
  onSuccess: [
    { primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: true } },
    { primitive: "gainMP", params: { target: "$self", amount: 100 } }
  ],
  onFailure: [
    { primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: true } },
    { primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }
  ]
};

registerCard(ULTIMATE_CHALLENGE);
