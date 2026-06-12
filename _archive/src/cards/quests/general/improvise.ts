import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Creative ★★★ = auto-success. OR pay 15 MP = attempt with roll.
// Simplified: auto-succeed if Creative ★★★. Otherwise flat roll 4+.
// Cost (15 MP) for non-auto path applied via effects in both outcomes.
// Flagged in phase6-questions.md: alternate-path cost not enforced.
export const IMPROVISE: QuestDefinition = {
  id: "quest_improvise" as CardId,
  name: "Improvise!",
  category: "quest",
  subcategory: "CREATIVE",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Creative", minStars: 3 } },
  roll: {
    die: "d6",
    trait: "Creative",
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 50 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(IMPROVISE);
