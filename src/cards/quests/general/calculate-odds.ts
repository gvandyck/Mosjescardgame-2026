import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Reveal top 3 cards of your deck. If 2+ share same type: succeed, else fail."
// Complex — requires new reveal+compare logic. Simplified to a flat 50/50 roll.
// Flagged in phase6-questions.md.
// Success: +20 MP + recover 1 card to hand
export const CALCULATE_ODDS: QuestDefinition & { onSuccessRecovery?: any } = {
  id: "quest_calculate_odds" as CardId,
  name: "Calculate Odds",
  category: "quest",
  subcategory: "MENTAL",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  roll: {
    die: "d6",
    trait: "Mental",
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }],
  // Recovery config: after success, allow recovering 1 card to hand
  onSuccessRecovery: {
    count: 1,
    destination: "hand",
    filter: null,
  }
};

registerCard(CALCULATE_ODDS);
