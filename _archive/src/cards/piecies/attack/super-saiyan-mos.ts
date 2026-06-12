import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const SUPER_SAIYAN_MOS: CardDefinition = {
  id: "super-saiyan-mos" as CardId,
  name: "Super Saiyan Mos",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15, levelRequirement: 1 },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "next_quest_drain_target",
        data: { targetRef: "$target", drainAmount: 25 },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(SUPER_SAIYAN_MOS);
