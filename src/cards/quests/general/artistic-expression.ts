import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Active Mosje has Creative ★★ OR you have drawn 2 cards this turn."
// Simplified: auto-succeed if Creative ★★. "drawn 2 cards" path requires event log
// checking (flagged in phase6-questions.md).
export const ARTISTIC_EXPRESSION: QuestDefinition = {
  id: "quest_artistic_expression" as CardId,
  name: "Artistic Expression",
  category: "quest",
  subcategory: "CREATIVE",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Creative", minStars: 2 } },
  roll: {
    die: "d6",
    trait: "Creative",
    thresholds: { "1": 4, "2": 3, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }]
};

registerCard(ARTISTIC_EXPRESSION);
