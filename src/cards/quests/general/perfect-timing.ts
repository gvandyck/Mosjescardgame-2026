import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Active Mosje must have EXACTLY 75 MP." Uses operator "==" on MP check.
export const PERFECT_TIMING: QuestDefinition = {
  id: "quest_perfect_timing" as CardId,
  name: "Perfect Timing",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "mp", params: { operator: "==", value: 75 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "mp", params: { operator: "==", value: 75 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 40, isCostPayment: false } }]
};

registerCard(PERFECT_TIMING);
