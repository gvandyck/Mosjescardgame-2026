import type { CardId } from "../../types/card-id.js";
import type { PlaceDefinition } from "../schema/place-definition.js";
import { registerCard } from "../registry/card-registry.js";

export const THE_GYM: PlaceDefinition = {
  id: "place_the_gym" as CardId,
  name: "The Gym",
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
                condition: { primitive: "checkTrait", params: { target: "$target", trait: "Physical", minStars: 3 } },
                then: { primitive: "gainMP", params: { target: "$target", amount: 35 } },
                else: {
                  primitive: "ifThenElse",
                  params: {
                    condition: {
                      primitive: "checkTrait",
                      params: { target: "$target", trait: "Physical", minStars: 2 }
                    },
                    then: { primitive: "gainMP", params: { target: "$target", amount: 25 } },
                    else: {
                      primitive: "loseMP",
                      params: { target: "$target", amount: 10, isCostPayment: false }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  ]
};

registerCard(THE_GYM);
