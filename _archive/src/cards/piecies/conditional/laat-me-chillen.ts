import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const LAAT_ME_CHILLEN: CardDefinition = {
  id: "laat-me-chillen" as CardId,
  name: "Laat Me Chillen",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 20 } },
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "untargetable",
        data: { locked: true },
        expiryTurn: "$currentTurn"
      }
    }
  ]
};

registerCard(LAAT_ME_CHILLEN);
