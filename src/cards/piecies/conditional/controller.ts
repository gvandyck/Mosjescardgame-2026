import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const CONTROLLER: CardDefinition = {
  id: "controller" as CardId,
  name: "Controller",
  category: "piecie",
  subcategory: "DIGITAL-EQUIPMENT",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 10 } },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Technical", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 15 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
      }
    }
  ]
};

registerCard(CONTROLLER);
