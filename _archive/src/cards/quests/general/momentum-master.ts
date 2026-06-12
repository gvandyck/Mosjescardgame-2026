import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Active Mosje must have between 80 and 100 MP." Both bounds enforced.
// Auto-succeed when requirement met (no roll).
export const MOMENTUM_MASTER: QuestDefinition = {
  id: "quest_momentum_master" as CardId,
  name: "Momentum Master",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "mp", params: { operator: "between", value: 80, rangeEnd: 100 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "mp", params: { operator: "between", value: 80, rangeEnd: 100 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 40, isCostPayment: false } }]
};

registerCard(MOMENTUM_MASTER);
