import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const TIKKER: CardDefinition = {
  id: "tikker" as CardId,
  name: "Tikker",
  category: "piecie",
  subcategory: "SUBSTANCE",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 40 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "quest_locked",
        data: { locked: true },
        expiryTurn: "$currentTurn + 1"
      }
    }
  ]
};

registerCard(TIKKER);
