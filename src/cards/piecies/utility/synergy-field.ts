import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const SYNERGY_FIELD: CardDefinition = {
  id: "synergy-field" as CardId,
  name: "Synergy Field",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "synergy_active_forced",
        data: { forceSynergies: true },
        expiryTurn: "$currentTurn + 3"
      }
    },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ]
};

registerCard(SYNERGY_FIELD);
