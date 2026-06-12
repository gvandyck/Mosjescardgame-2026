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
  flavorText:
    "Intended: choose a Mosje in a Welloe pile and summon it to the field at Level 1, 0 MP. This Piecie remains linked to that Mosje; if this Piecie leaves play, the Mosje returns to Welloe. Stub: returns the chosen Mosje to hand until summonFromWelloe exists.",
  // Intended Call of the Haunted-style behavior is documented above. The engine
  // does not have linked field attachments yet, so this remains a returnToHand stub.
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
