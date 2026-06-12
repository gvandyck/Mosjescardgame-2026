import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const BATTLE_CONCERT: CardDefinition = {
  id: "battle-concert" as CardId,
  name: "Battle Concert",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 25, levelRequirement: 2 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$target", amount: 30 } },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Creative", minStars: 2 }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 20 } }
      }
    }
  ]
};

registerCard(BATTLE_CONCERT);
