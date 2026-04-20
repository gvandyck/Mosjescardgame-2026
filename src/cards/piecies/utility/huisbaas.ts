import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const HUISBAAS: CardDefinition = {
  id: "huisbaas" as CardId,
  name: "Huisbaas",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "destroyPlace", params: {} },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Social", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 20 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 10 } }
      }
    }
  ]
};

registerCard(HUISBAAS);
