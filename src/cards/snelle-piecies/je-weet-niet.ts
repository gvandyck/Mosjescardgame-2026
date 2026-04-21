import type { CardDefinition } from "../schema/card-definition.js";
import type { CardId } from "../../types/card-id.js";
import { registerCard } from "../registry/card-registry.js";

// Jeweetniet wie Ikben — negate all MP loss for active Mosje this turn AND next player turn.
export const JE_WEET_NIET: CardDefinition = {
  id: "snelle_jeweetniet" as CardId,
  name: "Jeweetniet wie Ikben",
  category: "snelle-piecie",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "instant",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "mp_loss_immune",
        data: { immune: true },
        expiryTurn: "$currentTurn + 2"
      }
    }
  ]
};

registerCard(JE_WEET_NIET);
