import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MP_ADJUSTER: CardDefinition = {
  id: "mp-adjuster" as CardId,
  name: "MP Adjuster",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkMP",
          params: { target: "$self", operator: ">=", value: 50 }
        },
        then: { primitive: "loseMP", params: { target: "$self", amount: 20 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 20 } }
      }
    }
  ]
};

registerCard(MP_ADJUSTER);
