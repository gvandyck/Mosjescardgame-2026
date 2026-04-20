import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const REDBULL: CardDefinition = {
  id: "redbull" as CardId,
  name: "Redbull",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 20, levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "drawCards", params: { playerId: "$player", count: 2 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "extra_piecie_slot_this_turn",
        data: { extraSlots: 1 },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(REDBULL);
