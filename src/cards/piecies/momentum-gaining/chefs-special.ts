import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const CHEFS_SPECIAL: CardDefinition = {
  id: "chefs-special" as CardId,
  name: "Chef's Special",
  category: "piecie",
  subcategory: "FOOD",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10, levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkCardTypeInPlay",
          params: { playerId: "$player", cardType: "ronald" }
        },
        then: {
          primitive: "chain",
          params: {
            effects: [
              {
                primitive: "forEachTarget",
                params: {
                  targetType: "all_opponents",
                  effect: {
                    primitive: "revealTopDeck",
                    params: { playerId: "$player", targetDeckOwner: "$targetPlayer", count: 99 }
                  }
                }
              },
              { primitive: "gainMP", params: { target: "$self", amount: 30 } }
            ]
          }
        },
        else: { primitive: "gainMP", params: { target: "$self", amount: 15 } }
      }
    }
  ]
};

registerCard(CHEFS_SPECIAL);
