import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

export const LUCKY_BREAK: QuestDefinition = {
  id: "quest_lucky_break" as CardId,
  name: "Lucky Break",
  category: "quest",
  subcategory: "CREATIVE",
  rarity: "rare",
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
    thresholds: { "1": 5, "2": 4, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 70 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 40, isCostPayment: false } }]
};

registerCard(LUCKY_BREAK);
