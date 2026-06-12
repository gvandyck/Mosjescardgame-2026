import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const CONTINUOUS_ASSAULT: CardDefinition = {
  id: "continuous-assault" as CardId,
  name: "Continuous Assault",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20, levelRequirement: 2 },
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
        data: { amount: 15, sourceCardId: "continuous-assault" },
        expiryTurn: "$currentTurn + 3"
      }
    }
  ]
};

registerCard(CONTINUOUS_ASSAULT);
