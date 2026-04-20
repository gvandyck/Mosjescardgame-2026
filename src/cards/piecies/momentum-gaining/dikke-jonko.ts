import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const DIKKE_JONKO: CardDefinition = {
  id: "dikke-jonko" as CardId,
  name: "Dikke Jonko",
  category: "piecie",
  subcategory: "FOOD",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "all_opponents",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 25 } },
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: { primitive: "gainMP", params: { target: "$target", amount: 10 } }
      }
    },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } },
    {
      primitive: "forEachTarget",
      params: {
        targetType: "all_opponents",
        effect: { primitive: "drawCards", params: { playerId: "$targetPlayer", count: 1 } }
      }
    }
  ]
};

registerCard(DIKKE_JONKO);
