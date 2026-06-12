import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "3 different actions this turn: activate Piecie, use Mosje ability, play Place."
// Complex multi-action tracking not available. Stub with flat roll 4+.
// Flagged in phase6-questions.md.
export const THE_GAUNTLET: QuestDefinition = {
  id: "quest_the_gauntlet" as CardId,
  name: "The Gauntlet",
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
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 50 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }]
};

registerCard(THE_GAUNTLET);
