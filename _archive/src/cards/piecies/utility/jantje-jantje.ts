import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const JANTJE_JANTJE: CardDefinition = {
  id: "jantje-jantje" as CardId,
  name: "Jantje Jantje",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$target", amount: 20 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$target",
        buffId: "mp_gain_reduced",
        data: { reduceBy: 10 },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(JANTJE_JANTJE);
