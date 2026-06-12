import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const KATJEGANG: CardDefinition = {
  id: "katjegang" as CardId,
  name: "KatjeGang",
  category: "piecie",
  subcategory: "PET",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 15 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: { turns: 2 },
  effects: [
    {
      primitive: "applyBuff",
      params: {
        target: "$self",
        buffId: "pet_active:katjegang",
        data: { petId: "katjegang", owner: "$player" },
        expiryTurn: "$currentTurn + 2"
      }
    },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ]
};

registerCard(KATJEGANG);
