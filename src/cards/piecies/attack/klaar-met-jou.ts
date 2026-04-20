import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const KLAAR_MET_JOU: CardDefinition = {
  id: "klaar-met-jou" as CardId,
  name: "Klaar Met Jou",
  category: "piecie",
  subcategory: "ATTACK",
  isBoosterOnly: false,
  cost: { type: "mp", mp: 25, levelRequirement: 2 },
  requirements: [{ type: "mp", params: { operator: "<=", value: 30, applyTo: "target" } }],
  target: "opponent_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "sendToWelloe", params: { target: "$target" } },
    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
  ]
};

registerCard(KLAAR_MET_JOU);
