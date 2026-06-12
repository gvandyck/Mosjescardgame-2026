import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const EENDJES_VOEREN: CardDefinition = {
  id: "eendjes-voeren" as CardId,
  name: "Eendjes voeren",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Resilient", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 40 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 30 } }
      }
    }
  ]
};

registerCard(EENDJES_VOEREN);
