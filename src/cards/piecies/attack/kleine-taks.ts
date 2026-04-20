import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const KLEINE_TAKS: CardDefinition = {
  id: "kleine-taks" as CardId,
  name: "Kleine Taks",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15, levelRequirement: 1 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$target", amount: 15 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$target",
        buffId: "end_of_turn_mp_loss",
        data: { amount: 10 },
        expiryTurn: "$currentTurn + 3"
      }
    }
  ]
};

registerCard(KLEINE_TAKS);
