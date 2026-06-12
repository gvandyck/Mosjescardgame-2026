import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const VARKENSPOOTJES: CardDefinition = {
  id: "varkenspootjes" as CardId,
  name: "Varkenspootjes",
  category: "piecie",
  subcategory: "FOOD",
  isBoosterOnly: false,
  cost: { type: "free" },
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
          params: { playerId: "$player", cardType: "binti" }
        },
        then: { primitive: "gainMP", params: { target: "$self", amount: 60 } },
        else: { primitive: "loseMP", params: { target: "$self", amount: 30, isCostPayment: false } }
      }
    }
  ]
};

registerCard(VARKENSPOOTJES);
