import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Technical ★★★ = auto-success. OR pay 20 MP = attempt with roll.
// Simplified: auto-succeed if Technical ★★★. Otherwise flat roll 5+ (Very Hard).
// Alternate-path cost not enforced. Flagged in phase6-questions.md.
export const HACK_MAINFRAME: QuestDefinition = {
  id: "quest_hack_mainframe" as CardId,
  name: "Hack Mainframe",
  category: "quest",
  subcategory: "TECHNICAL",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Technical", minStars: 3 } },
  roll: {
    die: "d6",
    thresholds: { "1": 5, "2": 6, "3": 6 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 30 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }]
};

registerCard(HACK_MAINFRAME);
