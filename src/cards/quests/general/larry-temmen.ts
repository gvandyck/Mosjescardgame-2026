import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "You must have piecie_larry_zegeltje on field OR in hand. Opponent guesses location.
// Wrong guess = you gain 70 MP AND opponent loses 30 MP. Correct = you take 60 MP damage."
// Interactive guess mechanic not available in current engine. Stub with flat roll.
// Flagged in phase6-questions.md.
export const LARRY_TEMMEN: QuestDefinition = {
  id: "quest_larry_temmen" as CardId,
  name: "Larry Temmen Niemand Zeggen",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [{ type: "custom", params: { desc: "piecie_larry_zegeltje on field or in hand" } }],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "general",
  roll: {
    die: "d6",
    thresholds: { "1": 4, "2": 4, "3": 4 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 70 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }]
};

registerCard(LARRY_TEMMEN);
