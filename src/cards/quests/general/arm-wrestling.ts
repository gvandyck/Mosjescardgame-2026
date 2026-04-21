import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

export const ARM_WRESTLING: QuestDefinition = {
  id: "quest_arm_wrestling" as CardId,
  name: "Arm Wrestling",
  category: "quest",
  subcategory: "PHYSICAL",
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
    thresholds: { "1": 5, "2": 3, "3": 2 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }]
};

registerCard(ARM_WRESTLING);
