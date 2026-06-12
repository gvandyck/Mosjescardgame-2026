import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const GEKKE_VOGELS: CardDefinition = {
  id: "gekke-vogels" as CardId,
  name: "Gekke Vogels",
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
        buffId: "pet_active:gekke-vogels",
        data: { petId: "gekke-vogels", owner: "$player" },
        expiryTurn: "$currentTurn + 2"
      }
    },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ]
};

registerCard(GEKKE_VOGELS);
