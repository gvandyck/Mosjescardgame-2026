import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const PLACEHOLDER_THE_DRAINER: MosjeDefinition = {
  id: "mosje_drainer" as CardId,
  name: "Placeholder 4 — The Drainer",
  category: "mosje",
  subcategory: "DIGITAL",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "opponent_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "DIGITAL",
  traits: { Physical: 0, Mental: 2, Social: 0, Creative: 0, Technical: 3, Resilient: 1 },
  startMP: 20,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Continuous Drain: at the start of each opponent's turn, all opponents lose 5 MP.",
    effects: [
      { primitive: "loseMP", params: { target: "$target", amount: 5 } }
    ]
  },
  synergies: []
};

registerCard(PLACEHOLDER_THE_DRAINER);
