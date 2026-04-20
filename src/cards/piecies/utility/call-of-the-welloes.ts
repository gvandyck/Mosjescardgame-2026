import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const CALL_OF_THE_WELLOES: CardDefinition = {
  id: "call-of-the-welloes" as CardId,
  name: "Call of the Welloes",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  // summonFromWelloe primitive is pending, so this step uses the approved stub.
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

registerCard(CALL_OF_THE_WELLOES);
