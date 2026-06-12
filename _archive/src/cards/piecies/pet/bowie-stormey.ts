import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const BOWIE_STORMEY: CardDefinition = {
  id: "bowie-stormey" as CardId,
  name: "Bowie & Stormey",
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
        buffId: "pet_active:bowie-stormey",
        data: { petId: "bowie-stormey", owner: "$player" },
        expiryTurn: "$currentTurn + 2"
      }
    },
    { primitive: "gainMP", params: { target: "$self", amount: 10 } }
  ],
  flavorText: "Bowie brings chaos. Stormey brings judgment. Together, unstoppable."
};

registerCard(BOWIE_STORMEY);
