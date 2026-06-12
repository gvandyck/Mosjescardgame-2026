import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

export const EMERGENCY_HEALINGS: CardDefinition = {
  id: "snelle_emergency_healings" as CardId,
  name: "Emergency Healings",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
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
        then: { primitive: "gainMP", params: { target: "$self", amount: 35 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 25 } }
      }
    }
  ]
};

registerCard(EMERGENCY_HEALINGS);
