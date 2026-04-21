import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const MARTIN_THE_PRECISION_DRIVER: MosjeDefinition = {
  id: "mosje_martin_driver" as CardId,
  name: "Martin The Precision Driver",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "on_activate",
  duration: "instant",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 2, Social: 0, Creative: 3, Technical: 2, Resilient: 0 },
  startMP: 20,
  baseAbility: {
    trigger: "on_activate",
    cost: { type: "free" },
    usageLimit: "once_per_turn",
    description: "Pit Stop Strategy: discard 2 cards from hand, draw 3 cards and gain 20 MP. (Discard-cost enforcement deferred — see phase8-questions.md.)",
    effects: [
      { primitive: "drawCards", params: { playerId: "$player", count: 3 } },
      { primitive: "gainMP", params: { target: "$self", amount: 20 } }
    ]
  },
  triggeredAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Perfect Line: after completing any Quest, gain +15 MP. Once per game at turn start: roll 1d6. 4-6=complete 1 additional Quest this turn (label only, deferred). 1-3=nothing.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 15 } }
    ]
  },
  synergies: []
};

registerCard(MARTIN_THE_PRECISION_DRIVER);
