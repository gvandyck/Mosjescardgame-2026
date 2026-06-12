import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const ALYSSA_THE_BULLDOZER: MosjeDefinition = {
  id: "alyssa-the-bulldozer" as CardId,
  name: "Alyssa The Bulldozer",
  category: "mosje",
  subcategory: "FIGHTING",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "FIGHTING",
  traits: { Physical: 3, Mental: 1, Social: 2, Creative: 1, Technical: 1, Resilient: 2 },
  startMP: 10,
  baseAbility: {
    trigger: "turn_start",
    usageLimit: "passive",
    description: "Unstoppable: gain 10 MP. If took 30+ cumulative damage this turn: also gain 25 MP.",
    effects: [
      { primitive: "gainMP", params: { target: "$self", amount: 10 } },
      {
        primitive: "ifThenElse",
        params: {
          condition: {
            primitive: "checkEventLogThisTurn",
            params: { eventType: "mp_lost", minAmount: 30, targetSelf: true }
          },
          then: { primitive: "gainMP", params: { target: "$self", amount: 25 } },
          else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
        }
      }
    ]
  },
  synergies: [
    {
      partnerCardId: "jisca-the-maestro" as CardId,
      description: "Fissa Power: ability also draws 1 card",
      bonusEffects: [{ primitive: "drawCards", params: { playerId: "$player", count: 1 } }]
    }
  ],
  petSynergies: [
    {
      petCardId: "katjegang" as CardId,
      bonusEffects: [{ primitive: "gainMP", params: { target: "$self", amount: 10 } }]
    }
  ]
};

registerCard(ALYSSA_THE_BULLDOZER);
