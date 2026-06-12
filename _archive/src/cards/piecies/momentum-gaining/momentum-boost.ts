import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOMENTUM_BOOST: CardDefinition = {
  id: "momentum-boost" as CardId,
  name: "Momentum Boost",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 15 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "next_quest_mp_bonus",
        data: { bonusMP: 10 },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(MOMENTUM_BOOST);
