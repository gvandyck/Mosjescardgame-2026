import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const GANDOE_THE_WIZARD: MosjeDefinition = {
  id: "gandoe-the-wizard" as CardId,
  name: "Gandoe The Wizard",
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
  traits: { Physical: 2, Mental: 2, Social: 1, Creative: 3, Technical: 1, Resilient: 1 },
  startMP: 10,
  baseAbility: {
    trigger: "turn_start",
    usageLimit: "passive",
    description: "Chaos Roll: roll 1d6. 1-2: lose 10 MP. 3-4: nothing. 5-6: gain 20 MP + draw 1.",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            {
              range: [1, 2],
              effect: {
                primitive: "loseMP",
                params: { target: "$self", amount: 10, isCostPayment: false }
              }
            },
            {
              range: [3, 4],
              effect: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
            },
            {
              range: [5, 6],
              effect: {
                primitive: "chain",
                params: {
                  effects: [
                    { primitive: "gainMP", params: { target: "$self", amount: 20 } },
                    { primitive: "drawCards", params: { playerId: "$player", count: 1 } }
                  ]
                }
              }
            }
          ]
        }
      }
    ]
  },
  synergies: [],
  petSynergies: []
};

registerCard(GANDOE_THE_WIZARD);
