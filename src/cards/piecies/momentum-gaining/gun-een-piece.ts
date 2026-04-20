import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const GUN_EEN_PIECE: CardDefinition = {
  id: "gun-een-piece" as CardId,
  name: "Gun Een Piece",
  category: "piecie",
  subcategory: "MOMENTUM-GAINING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "none",
  trigger: "on_play",
  duration: "instant",
  effects: [{ primitive: "drawCards", params: { playerId: "$player", count: 2 } }]
};

registerCard(GUN_EEN_PIECE);
