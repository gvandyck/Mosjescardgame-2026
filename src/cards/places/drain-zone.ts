import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const DRAIN_ZONE: PlaceDefinition = {
  id: "place_drain_zone" as CardId,
  name: "Drain Zone",
  category: "place",
  subcategory: "PLACE",
  rarity: "rare",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "shared_field",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  triggers: [
    {
      on: "turn_end",
      forPlayer: "both",
      effects: [
        {
          primitive: "forEachTarget",
          params: {
            targetType: "all_opponents",
            effect: {
              primitive: "loseMP",
              params: { target: "$target", amount: 10, isCostPayment: false }
            }
          }
        }
      ]
    }
  ]
};

registerCard(DRAIN_ZONE);
