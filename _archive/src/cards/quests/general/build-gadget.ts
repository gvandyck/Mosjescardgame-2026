import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Technical ★★ AND you must have activated a Piecie this turn."
// Activated-Piecie-this-turn check needs event log query. Simplified: only
// Technical ★★ requirement enforced. Flagged in phase6-questions.md.
export const BUILD_GADGET: QuestDefinition = {
  id: "quest_build_gadget" as CardId,
  name: "Build Gadget",
  category: "quest",
  subcategory: "TECHNICAL",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Technical", minStars: 2 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Technical", minStars: 2 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }]
};

registerCard(BUILD_GADGET);
