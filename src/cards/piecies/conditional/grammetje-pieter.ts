import type { CardDefinition } from "../../schema/card-definition.js";
import type { CardId } from "../../../types/card-id.js";
import { registerCard } from "../../registry/card-registry.js";

export const GRAMMETJE_PIETER: CardDefinition = {
  id: "grammetje-pieter" as CardId,
  name: "Grammetje Pieter",
  category: "piecie",
  subcategory: "SUBSTANCE",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_play",
  duration: "instant",
  effects: [
    { primitive: "gainMP", params: { target: "$self", amount: 30 } },
    { primitive: "loseMP", params: { target: "$self", amount: 15, isCostPayment: false } }
  ]
};

registerCard(GRAMMETJE_PIETER);
