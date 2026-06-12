import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Send an opponent's Mosje to the Welloe pile this turn OR pay 40 MP."
// Complex OR: Welloe-this-turn tracking + alternate cost. Both paths stubbed.
// Simplified to flat roll 4+. Flagged in phase6-questions.md.
export const ELIMINATION_CHALLENGE: QuestDefinition = {
  id: "quest_elimination_challenge" as CardId,
  name: "Elimination Challenge",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
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
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 80 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }]
};

registerCard(ELIMINATION_CHALLENGE);
