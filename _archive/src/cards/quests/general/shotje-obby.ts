import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "All players add up their Mosjes' MP totals. Highest → loses 20 to one, gains 60 to one.
// Middle players → gain 20. Last → nothing." Multi-player comparison/distribution.
// Stub with flat roll. Flagged in phase6-questions.md.
export const SHOTJE_OBBY: QuestDefinition = {
  id: "quest_shotje_obby" as CardId,
  name: "Shotje Obby",
  category: "quest",
  subcategory: "MIXED",
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
    thresholds: { "1": 3, "2": 3, "3": 3 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 20 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }]
};

registerCard(SHOTJE_OBBY);
