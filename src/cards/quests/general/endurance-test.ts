import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "60 MP or more OR Physical ★★★" requirement.
// Simplified: autoSucceedCondition checks >= 60 MP. Physical ★★★ path uses trait-based
// roll thresholds (making it near-certain for ★★★ users). Flagged in phase6-questions.md.
export const ENDURANCE_TEST: QuestDefinition = {
  id: "quest_endurance_test" as CardId,
  name: "Endurance Test",
  category: "quest",
  subcategory: "PHYSICAL",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "mp", params: { operator: ">=", value: 60 } },
  roll: {
    die: "d6",
    thresholds: { "1": 5, "2": 3, "3": 1 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 70, isCostPayment: false } }]
};

registerCard(ENDURANCE_TEST);
