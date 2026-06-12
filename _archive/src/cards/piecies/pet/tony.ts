import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const TONY: CardDefinition = {
  id: "tony" as CardId,
  name: "Tony",
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
        buffId: "pet_active:tony",
        data: { petId: "tony", owner: "$player" },
        expiryTurn: "$currentTurn + 2"
      }
    },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ],
  flavorText: "Just a cat. An excellent cat."
};

registerCard(TONY);
