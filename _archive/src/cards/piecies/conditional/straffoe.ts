import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const STRAFFOE: CardDefinition = {
  id: "straffoe" as CardId,
  name: "Straffoe",
  category: "piecie",
  subcategory: "SUBSTANCE",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 2 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Resilient", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 40 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 20 } }
      }
    }
  ]
};

registerCard(STRAFFOE);
