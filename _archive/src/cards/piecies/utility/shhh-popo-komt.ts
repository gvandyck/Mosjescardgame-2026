import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const SHHH_POPO_KOMT: CardDefinition = {
  id: "shhh-popo-komt" as CardId,
  name: "Shhh, popo komt!",
  category: "piecie",
  subcategory: "UTILITY",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "destroyPlace", params: {} },
    { primitive: "gainMP", params: { target: "$self", amount: 15 } }
  ]
};

registerCard(SHHH_POPO_KOMT);
