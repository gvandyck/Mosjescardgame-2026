import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

export const LUCKY_COIN: CardDefinition = {
  id: "snelle_lucky_coin" as CardId,
  name: "Lucky Cóin",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [{ type: "trait", params: { trait: "Creative", minStars: 1 } }],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkTrait",
          params: { target: "$self", trait: "Creative", minStars: 3 }
        },
        then: { primitive: "chooseDieResult", params: { chosenValue: 6 } },
        else: { primitive: "rerollDie", params: {} }
      }
    }
  ]
};

registerCard(LUCKY_COIN);
