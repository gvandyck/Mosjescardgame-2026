import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Roll 1d6: 1-3 = Failure, 4-6 = Success." Pure flat 50/50.
export const LEAP_OF_FAITH: QuestDefinition = {
  id: "quest_leap_of_faith" as CardId,
  name: "Leap of Faith",
  category: "quest",
  subcategory: "MIXED",
  rarity: "epic",
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
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 60 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(LEAP_OF_FAITH);
