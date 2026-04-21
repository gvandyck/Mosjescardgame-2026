import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Activated piecie_keyboard, piecie_mouse, or piecie_controller at some point this game."
// Requires tracking card activation history across turns. Stub with custom requirement.
// Flagged in phase6-questions.md.
export const LATE_NIGHT_QUESTING: QuestDefinition = {
  id: "quest_late_night_questing" as CardId,
  name: "Late Night Questing",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { desc: "Activated keyboard/mouse/controller this game" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  autoSucceedCondition: { type: "custom", params: { desc: "Activated keyboard/mouse/controller this game" } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 50 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }]
};

registerCard(LATE_NIGHT_QUESTING);
