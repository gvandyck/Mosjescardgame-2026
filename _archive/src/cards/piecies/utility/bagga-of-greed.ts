import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const BAGGA_OF_GREED: CardDefinition = {
  id: "bagga-of-greed" as CardId,
  name: "Bagga of Greed",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "drawCards", params: { playerId: "$player", count: 2 } },
    {
      primitive: "discardCards",
      params: {
        playerId: "$player",
        count: 1,
        mode: "choose",
        chosenCardIds: "$choice:baggaDiscard"
      }
    }
  ]
};

registerCard(BAGGA_OF_GREED);
