import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const AZN_CLESS: MosjeDefinition = {
  id: "azn-cless" as CardId,
  name: "AZN Cless",
  category: "mosje",
  subcategory: "FIGHTING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "turn_end",
  duration: "while_active",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 2, Mental: 2, Social: 2, Creative: 2, Technical: 1, Resilient: 1 },
  startMP: 10,
  baseAbility: {
    trigger: "turn_end",
    cost: { type: "discard", discardCount: 1 },
    usageLimit: "once_per_turn",
    description: "Risk and Reward: discard 1, gain 10 MP, draw 2.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 10 } },
      { primitive: "drawCards", params: { playerId: "$player", count: 2 } }
    ]
  },
  synergies: [
    {
      partnerCardId: "west-sr-tactical" as CardId,
      description: "gain 15 MP instead of 10",
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    },
    {
      partnerCardId: "martin-senor-west" as CardId,
      description: "gain 15 MP instead of 10",
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 5 } }]
    }
  ],
  petSynergies: [
    {
      petCardId: "vianna-poes" as CardId,
      bonusEffects: [{ primitive: "drawCards", params: { playerId: "$player", count: 1 } }]
    }
  ]
};

registerCard(AZN_CLESS);
