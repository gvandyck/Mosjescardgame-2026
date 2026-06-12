import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const TEMPIECIE: CardDefinition = {
  id: "tempiecie" as CardId,
  name: "TemPiecie",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15, levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "returnToHand",
      params: { playerId: "$player", zone: "discard", cardId: "$choice:cardId" }
    },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "retrieved_card_locked",
        data: { cardId: "$choice:cardId" },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(TEMPIECIE);
