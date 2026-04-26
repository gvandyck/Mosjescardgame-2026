import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Mental ★★★ AND 3+ face-down Piecies required.
// Simplified: Mental ★★★ requirement enforced; face-down Piecie count checked at resolution.
// Flagged in phase6-questions.md.
// Success: +35 MP + recover 1 Piecie (only) to field face-down
export const MASTER_PLAN: QuestDefinition & { onSuccessRecovery?: any, minFaceDownPiecies?: number } = {
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
  roll: {
    die: "d6",
    trait: "Mental",
    thresholds: { "1": 4, "2": 4, "3": 5 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 35 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }],
  // Recovery config: after success, allow recovering 1 Piecie to field face-down
  onSuccessRecovery: {
    count: 1,
    destination: "field-facedown",
    filter: "piecie",
  },
  // Additional requirement: must have 3+ face-down Piecies on field
  minFaceDownPiecies: 3,
};

registerCard(MASTER_PLAN);
