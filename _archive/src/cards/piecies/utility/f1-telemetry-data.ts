import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const F1_TELEMETRY_DATA: CardDefinition = {
  id: "f1-telemetry-data" as CardId,
  name: "F1 Telemetry Data",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
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
          params: { target: "$self", trait: "Technical", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 40 } },
        else: { primitive: "gainMP", params: { target: "$self", amount: 20 } }
      }
    },
    { primitive: "lookAtTop", params: { playerId: "$player", targetDeckOwner: "$player", count: 2 } }
  ]
};

registerCard(F1_TELEMETRY_DATA);
