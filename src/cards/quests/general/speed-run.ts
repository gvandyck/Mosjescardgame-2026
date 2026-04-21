import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Activated 2+ Piecies this turn." Piecie-activation-count tracking this turn
// requires event log scan. Stub with custom requirement. Flagged in phase6-questions.md.
export const SPEED_RUN: QuestDefinition = {
  id: "quest_speed_run" as CardId,
  name: "Speed Run",
  category: "quest",
  subcategory: "MIXED",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { desc: "Activated 2+ Piecies this turn" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { desc: "Activated 2+ Piecies this turn" } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 50, isCostPayment: false } }]
};

registerCard(SPEED_RUN);
