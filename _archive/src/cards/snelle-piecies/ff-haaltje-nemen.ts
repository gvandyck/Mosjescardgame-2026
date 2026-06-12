import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

export const FF_HAALTJE_NEMEN: CardDefinition = {
  id: "snelle_ff_haaltje_nemen" as CardId,
  name: "FF Haaltje Nemen",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Resilient", minStars: 2 }
        },
        then: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 30, duration: 1 } },
        else: { primitive: "reduceMPLossBy", params: { target: "$self", amount: 20, duration: 1 } }
      }
    }
  ]
};

registerCard(FF_HAALTJE_NEMEN);
