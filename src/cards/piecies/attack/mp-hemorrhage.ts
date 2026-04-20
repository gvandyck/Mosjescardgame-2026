import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const MP_HEMORRHAGE: CardDefinition = {
  id: "mp-hemorrhage" as CardId,
  name: "MP Hemorrhage",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 25, levelRequirement: 2 },
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
        buffId: "end_of_turn_mp_loss",
        data: { amount: 15 },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(MP_HEMORRHAGE);
