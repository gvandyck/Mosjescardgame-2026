import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Dealt 30+ MP damage to opponents this turn." Damage-tracking-this-turn requires
// event log scan. Stub with custom requirement. Flagged in phase6-questions.md.
export const SUSTAINED_ASSAULT: QuestDefinition = {
  id: "quest_sustained_assault" as CardId,
  name: "Sustained Assault",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { desc: "Dealt 30+ MP damage this turn" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { desc: "Dealt 30+ MP damage this turn" } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 50 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }]
};

registerCard(SUSTAINED_ASSAULT);
