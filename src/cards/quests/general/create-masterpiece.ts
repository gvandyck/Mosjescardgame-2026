import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Creative ★★ AND 3+ Piecies in play." 3+ Piecies check requires a query primitive
// for counting face-up piecie slots. Simplified: only Creative ★★ requirement enforced.
// Flagged in phase6-questions.md.
export const CREATE_MASTERPIECE: QuestDefinition = {
  id: "quest_create_masterpiece" as CardId,
  name: "Create Masterpiece",
  category: "quest",
  subcategory: "CREATIVE",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Creative", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Creative", minStars: 2 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(CREATE_MASTERPIECE);
