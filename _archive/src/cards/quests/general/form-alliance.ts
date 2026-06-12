import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Social ★★ required. "Give 10 MP from your Mosje to an opponent's Mosje."
// Uses drainMP(from: $self, to: $target) – requires targetRef in QuestInvocation.
// If no targetRef provided, drainMP will fail silently (missing target warning).
// Flagged in phase6-questions.md: needs opponent targeting in UI.
export const FORM_ALLIANCE: QuestDefinition = {
  id: "quest_form_alliance" as CardId,
  name: "Form Alliance",
  category: "quest",
  subcategory: "SOCIAL",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "trait", params: { trait: "Social", minStars: 2 } }],
  target: "opponent_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "trait", params: { trait: "Social", minStars: 2 } },
  onSuccess: [
    { primitive: "drainMP", params: { from: "$self", to: "$target", amount: 10 } },
    { primitive: "gainMP", params: { target: "$self", amount: 30 } }
  ],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(FORM_ALLIANCE);
