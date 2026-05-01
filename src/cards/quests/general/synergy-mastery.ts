import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Used Mosje's unique ability AND completed at least 1 Quest this turn."
// Both conditions require event log scanning. Stub with custom requirement.
// Flagged in phase6-questions.md.
export const SYNERGY_MASTERY: QuestDefinition = {
  id: "quest_synergy_mastery" as CardId,
  name: "Synergy Mastery",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { description: "Used Mosje ability AND completed 1 Quest this turn" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { description: "Used Mosje ability AND completed 1 Quest this turn" } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 70 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 35, isCostPayment: false } }]
};

registerCard(SYNERGY_MASTERY);
