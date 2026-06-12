import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const SNOEIERTJE: CardDefinition = {
  id: "snoeiertje" as CardId,
  name: "Snoeiertje",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$target", amount: 15 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "end_of_turn_mp_loss",
        data: { amount: 15 },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(SNOEIERTJE);
