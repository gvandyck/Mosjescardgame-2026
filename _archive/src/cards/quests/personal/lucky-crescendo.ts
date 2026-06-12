import type { CardId } from "../../../types/card-id.js";
import type { QuestDefinition } from "../../schema/quest-definition.js";
import { registerCard } from "../../registry/card-registry.js";

// Personal quest for [DJ 80/20].
// "Requires DJ 80/20 active and Skiffa Place card active. Roll 5+.
//  All opponents lose 20 MP on success."
// DJ 80/20 enforced by requiredMosjeCardId. Skiffa checked via place_active requirement.
export const LUCKY_CRESCENDO: QuestDefinition = {
  id: "quest_personal_lucky_crescendo" as CardId,
  name: "Lucky Crescendo",
  category: "quest",
  subcategory: "CREATIVE",
  rarity: "legendary",
  isBoosterOnly: true,
  cost: { type: "free" },
  requirements: [
    { type: "place_active", params: { placeCardId: "place_skiffa" } }
  ],
  target: "self_active_mosje",
  trigger: "quest_attempt",
  duration: "instant",
  effects: [],
  scope: "personal",
  requiredMosjeCardId: "mosje_dj_8020" as CardId,
  roll: { die: "d6", thresholds: { "1": 5, "2": 5, "3": 5 } },
  onSuccess: [
    { primitive: "gainMP", params: { target: "$self", amount: 80 } },
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: { primitive: "loseMP", params: { target: "$target", amount: 20, isCostPayment: false } }
      }
    }
  ],
  onFailure: [{ primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } }]
};

registerCard(LUCKY_CRESCENDO);
