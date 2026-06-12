import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// "After resolving: each player who took MP damage this turn may discard 1 card to
// regain 40 MP. Special bonus for [GANDOE]/[DJ] tags and high-damage players."
// Requires complex multi-player resolution and tag checks. Stub with flat roll.
// Flagged in phase6-questions.md.
export const GEEN_RAAD_VRAAG_AAD: QuestDefinition = {
  id: "quest_geen_raad_vraag_aad" as CardId,
  name: "Geen Raad? Vraag Aad!",
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
    thresholds: { "1": 3, "2": 3, "3": 3 }
  },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 40 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }]
};

registerCard(GEEN_RAAD_VRAAG_AAD);
