import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Social ★★★ = auto-success. OR discard 1 Piecie from hand = attempt with roll.
// Simplified: auto-succeed if Social ★★★. Otherwise flat roll 3+ (Easy difficulty).
// Flagged in phase6-questions.md: discard-Piecie alternate cost path not enforced.
export const NEGOTIATION: QuestDefinition = {
  id: "quest_negotiation" as CardId,
  name: "Negotiation",
  category: "quest",
  subcategory: "SOCIAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Social", minStars: 3 } },
  roll: {
    die: "d6",
    thresholds: { "1": 3, "2": 3, "3": 3 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 25 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }]
};

registerCard(NEGOTIATION);
