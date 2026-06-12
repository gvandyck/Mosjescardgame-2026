import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Personal quest for [Jeffrey] The Strongman.
// "Requires Jeffrey on field and 40+ total MP damage taken this game. Roll 4+."
// Jeffrey-on-field enforced by requiredMosjeCardId in the engine.
// 40+ damage tracking is stubbed as a custom requirement (always true).
export const IRON_WILL: QuestDefinition = {
  id: "quest_personal_iron_will" as CardId,
  name: "Iron Will",
  category: "quest",
  subcategory: "PHYSICAL",
  rarity: "legendary",
  isBoosterOnly: true,
  cost: { type: "free" },
  requirements: [
    // Stub: requires 40+ total MP damage taken this game (event-log based, always true for now)
    { type: "custom", params: { description: "40_or_more_total_mp_damage_taken_this_game" } }
  ],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "personal",
  requiredMosjeCardId: "mosje_jeffrey" as CardId,
  roll: { die: "d6", thresholds: { "1": 4, "2": 4, "3": 4 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 90 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }]
};

registerCard(IRON_WILL);
