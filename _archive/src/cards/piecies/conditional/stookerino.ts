import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const STOOKERINO: CardDefinition = {
  id: "stookerino" as CardId,
  name: "Stookerino",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10, levelRequirement: 1 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$target",
        buffId: "ability_locked",
        data: { locked: true },
        expiryTurn: "$currentTurn + 1"
      }
    },
    { primitive: "loseMP", params: { target: "$target", amount: 10 } }
  ]
};

registerCard(STOOKERINO);
