import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Mental ★★★ AND 3+ face-down Piecies required.
// Simplified: Mental ★★★ requirement enforced; face-down Piecie count not checked
// (no face-down piecie count condition available). Flagged in phase6-questions.md.
export const MASTER_PLAN: QuestDefinition = {
  id: "quest_master_plan" as CardId,
  name: "Master Plan",
  category: "quest",
  subcategory: "MENTAL",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Mental", minStars: 3 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Mental", minStars: 3 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 35 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }]
};

registerCard(MASTER_PLAN);
