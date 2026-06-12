import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const ZO_IS_NATUUR: PlaceDefinition = {
  id: "place_zo_is_natuur" as CardId,
  name: "Zo is Natuur",
  category: "place",
  subcategory: "PLACE",
  rarity: "uncommon",
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
            targetType: "all_mosjes",
            effect: {
              primitive: "ifThenElse",
              params: {
                condition: { primitive: "checkTrait", params: { target: "$target", trait: "Resilient", minStars: 1 } },
                then: { primitive: "gainMP", params: { target: "$target", amount: 15 } },
                else: { primitive: "gainMP", params: { target: "$target", amount: 10 } }
              }
            }
          }
        }
      ]
    }
  ]
};

registerCard(ZO_IS_NATUUR);
