import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Personal quest for [Martin] Senor West.
// "Correctly name the type of the top 3 cards of any deck."
// Interactive resolution is stubbed as a flat roll 4+ until the UI layer supports it.
export const PERFECT_READ: QuestDefinition = {
  id: "quest_west_perfect_read" as CardId,
  name: "Perfect Read",
  category: "quest",
  subcategory: "MENTAL",
  rarity: "legendary",
  isBoosterOnly: true,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "personal",
  requiredMosjeCardId: "mosje_martin_senor_west" as CardId,
  // Stub: interactive "name card type" resolved as flat roll 4+
  roll: { die: "d6", thresholds: { "1": 4, "2": 4, "3": 4 } },
  onSuccess: [{ primitive: "gainMP", params: { target: "$self", amount: 80 } }],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }]
};

registerCard(PERFECT_READ);
