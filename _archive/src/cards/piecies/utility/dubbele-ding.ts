import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const DUBBELE_DING: CardDefinition = {
  id: "dubbele-ding" as CardId,
  name: "Dubbele Ding",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "double_next_mp_gain",
        data: { multiplier: 2 }
      }
    }
  ]
};

registerCard(DUBBELE_DING);
