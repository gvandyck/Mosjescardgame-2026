import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Personal quest for [Martin] Señor West.
// "Requires [Martin] Señor West and [Coert] The Hawaiian Tech Savant both active. Auto-success.
//  Look at the opponent's full hand."
// West-on-field enforced by requiredMosjeCardId. Coert-on-field checked via card_in_play.
// "Look at opponent's full hand" is stubbed (no revealHand primitive yet).
export const PERFECT_SYNC: QuestDefinition = {
  id: "quest_personal_perfect_sync" as CardId,
  name: "Perfect Sync",
  category: "quest",
  subcategory: "TECHNICAL",
  rarity: "legendary",
  isBoosterOnly: true,
  cost: { type: "free" },
  requirements: [
    { type: "card_in_play", params: { cardType: "mosje_coert_tech" } }
  ],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "personal",
  requiredMosjeCardId: "mosje_martin_senor_west" as CardId,
  // Auto-succeed when Coert is confirmed in play (requirements already gate this)
  autoSucceedCondition: { type: "card_in_play", params: { cardType: "mosje_coert_tech" } },
  onSuccess: [
    // Stub: "look at opponent's full hand" not yet implementable
    { primitive: "gainMP", params: { target: "$self", amount: 70 } }
  ],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } }]
};

registerCard(PERFECT_SYNC);
