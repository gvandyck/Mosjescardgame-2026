import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Pay 10 MP (cost embedded in both outcomes) AND roll 4+.
// Simplified: the 10 MP cost is applied as first effect in both onSuccess and onFailure.
export const PARKOUR_CHALLENGE: QuestDefinition = {
  id: "quest_parkour_challenge" as CardId,
  name: "Parkour Challenge",
  category: "quest",
  subcategory: "PHYSICAL",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "mp", params: { operator: ">=", value: 10 } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [
    { primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: true } },
    { primitive: "gainMP", params: { target: "$self", amount: 50 } }
  ],
  onFailure: [
    { primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: true } },
    { primitive: "loseMP", params: { target: "$self", amount: 70, isCostPayment: false } }
  ]
};

registerCard(PARKOUR_CHALLENGE);
