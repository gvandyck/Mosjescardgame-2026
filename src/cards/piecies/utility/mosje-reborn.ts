import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MOSJE_REBORN: CardDefinition = {
  id: "mosje-reborn" as CardId,
  name: "Mosje Reborn",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "returnToHand",
      params: {
        playerId: "$player",
        zone: "welloe",
        cardId: "$choice:mosjeId"
      }
    }
  ]
};

registerCard(MOSJE_REBORN);
