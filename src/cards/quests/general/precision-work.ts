import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

export const PRECISION_WORK: QuestDefinition = {
  id: "quest_precision_work" as CardId,
  name: "Precision Work",
  category: "quest",
  subcategory: "TECHNICAL",
  rarity: "uncommon",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 3, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 70 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 70, isCostPayment: false } }]
};

registerCard(PRECISION_WORK);
