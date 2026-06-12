import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOUSE: CardDefinition = {
  id: "mouse" as CardId,
  name: "Mouse",
  category: "piecie",
  subcategory: "DIGITAL-EQUIPMENT",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 10 } },
    {
      primitive: "ifThenElse",
      params: {
        condition: {
          condition: "checkCardTypeInPlay",
          params: { playerId: "$player", cardType: "keyboard" }
        },
        then: {
          primitive: "searchDeckAndDraw",
          params: { playerId: "$player", filter: { subcategory: "DIGITAL-EQUIPMENT" } }
        },
        else: { primitive: "drawCards", params: { playerId: "$player", count: 0 } }
      }
    }
  ]
};

registerCard(MOUSE);
