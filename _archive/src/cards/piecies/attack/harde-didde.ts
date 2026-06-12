import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const HARDE_DIDDE: CardDefinition = {
  id: "harde-didde" as CardId,
  name: "Harde Didde",
  category: "piecie",
  subcategory: "ATTACK",
  flavorText: "Defeat an opponent Mosje with 50 MP or less.",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 40, levelRequirement: 2 },
  requirements: [{ type: "mp", params: { operator: "<=", value: 50, applyTo: "target" } }],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "sendToWelloe", params: { target: "$target" } },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ]
};

registerCard(HARDE_DIDDE);
