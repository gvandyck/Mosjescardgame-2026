import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Activated 3+ Piecies this turn." Same tracking issue as Speed Run.
// Stub with custom requirement. Flagged in phase6-questions.md.
export const CHAIN_MASTER: QuestDefinition = {
  id: "quest_chain_master" as CardId,
  name: "Chain Master",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { description: "Activated 3+ Piecies this turn" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { description: "Activated 3+ Piecies this turn" } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 55 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 25, isCostPayment: false } }]
};

registerCard(CHAIN_MASTER);
