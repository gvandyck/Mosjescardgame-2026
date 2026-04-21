import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "Take 60 MP self-damage. Remove up to 5 cards from any discard permanently.
// COERT → reduce to 40 damage. CLESS on opponent → +20 damage to them.
// place_delluft active → +30 MP after."
// Complex multi-tag and place interaction. Stub: self-damage + flat roll.
// Flagged in phase6-questions.md.
export const PARKEREN_DELFT: QuestDefinition = {
  id: "quest_parkeren_delft" as CardId,
  name: "Parkeren Delft",
  category: "quest",
  subcategory: "MIXED",
  rarity: "legendary",
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
  onSuccess: [
    { primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } },
    { primitive: "gainMP", params: { target: "$self", amount: 30 } }
  ],
  onFailure: [
    { primitive: "loseMP", params: { target: "$self", amount: 60, isCostPayment: false } }
  ]
};

registerCard(PARKEREN_DELFT);
