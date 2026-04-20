import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const STRIPJE_BENNIES: CardDefinition = {
  id: "stripje-bennies" as CardId,
  name: "Stripje Bennies",
  category: "piecie",
  subcategory: "SUBSTANCE",
  isBoosterOnly: false,
  cost: { type: "free", levelRequirement: 1 },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "loseMP", params: { target: "$self", amount: 20, isCostPayment: false } },
    { primitive: "drawCards", params: { playerId: "$player", count: 3 } }
  ]
};

registerCard(STRIPJE_BENNIES);
