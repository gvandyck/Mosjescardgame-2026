import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Technical ★★ required. "Look at top 5 cards of any deck" is a reveal effect
// that needs a new primitive. Simplified: requirement enforced but no reveal effect.
// Flagged in phase6-questions.md.
export const DEBUG_SYSTEM: QuestDefinition = {
  id: "quest_debug_system" as CardId,
  name: "Debug System",
  category: "quest",
  subcategory: "TECHNICAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Technical", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Technical", minStars: 2 } },
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 5, "3": 5 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }]
};

registerCard(DEBUG_SYSTEM);
