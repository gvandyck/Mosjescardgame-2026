import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Count Piecies in play. Target one opponent. Complex resolution based on comparison."
// Special resolution logic (if-else on Piecie counts) can't be expressed as simple
// effect primitives. Stub with flat roll 4+. Flagged in phase6-questions.md.
export const REGELAAR: QuestDefinition = {
  id: "quest_regelaar" as CardId,
  name: "Regelaar",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
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
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 25, isCostPayment: false } }]
};

registerCard(REGELAAR);
