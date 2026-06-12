import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Resilient ★★★ AND Level 1. Both conditions enforced.
// Auto-succeed when both requirements pass.
// Level 1 "exactly" constraint uses custom type (checkLevel only supports >=).
// Flagged in phase6-questions.md.
export const NEVER_GIVE_UP: QuestDefinition = {
  id: "quest_never_give_up" as CardId,
  name: "Never Give Up",
  category: "quest",
  subcategory: "RESILIENT",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [
    { type: "trait", params: { trait: "Resilient", minStars: 3 } },
    { type: "custom", params: { description: "Mosje must be exactly Level 1" } }
  ],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Resilient", minStars: 3 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }]
};

registerCard(NEVER_GIVE_UP);
