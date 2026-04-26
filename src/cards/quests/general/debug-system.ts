import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Technical ★★ required. "Look at top 5 cards of any deck" is a reveal effect
// that needs a new primitive. Simplified: requirement enforced but no reveal effect.
// Also requires active Place to be "Digital Gaming Stop".
// Flagged in phase6-questions.md.
// Success: +40 MP + recover 2 cards to deck (will be shuffled)
export const DEBUG_SYSTEM: QuestDefinition & { onSuccessRecovery?: any, requiredPlace?: string } = {
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
    trait: "Technical",
    thresholds: { "1": 4, "2": 5, "3": 5 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }],
  // Recovery config: after success, allow recovering 2 cards to deck (will shuffle)
  onSuccessRecovery: {
    count: 2,
    destination: "deck",
    filter: null,
  },
  // Place requirement: Active Place must be "Digital Gaming Stop" for success
  requiredPlace: "place_digital_gaming_stop",
};

registerCard(DEBUG_SYSTEM);
