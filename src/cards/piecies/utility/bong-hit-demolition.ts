import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const BONG_HIT_DEMOLITION: CardDefinition = {
  id: "bong-hit-demolition" as CardId,
  name: "Bong Hit Demolition",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 10 },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "destroyPlace", params: {} },
    { primitive: "drawCards", params: { playerId: "$player", count: 2 } }
  ]
};

registerCard(BONG_HIT_DEMOLITION);
