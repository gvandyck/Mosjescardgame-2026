import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const WARM_KANNETJE_MELK: CardDefinition = {
  id: "warm-kannetje-melk" as CardId,
  name: "Warm Kannetje Melk",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$self", amount: 10, isCostPayment: false } },
    { primitive: "drawCards", params: { playerId: "$player", count: 2 } }
  ]
};

registerCard(WARM_KANNETJE_MELK);
