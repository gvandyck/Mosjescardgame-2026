import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Your active Mosje must have lost 25+ MP this turn before attempting."
// Requires tracking total MP loss this turn via event log. Not implementable with
// current RequirementDefinition types. Simplified to no requirement (always attemptable).
// Flagged in phase6-questions.md.
export const ENDURE_PAIN: QuestDefinition = {
  id: "quest_endure_pain" as CardId,
  name: "Endure Pain",
  category: "quest",
  subcategory: "RESILIENT",
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
    thresholds: { "1": 4, "2": 3, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }]
};

registerCard(ENDURE_PAIN);
