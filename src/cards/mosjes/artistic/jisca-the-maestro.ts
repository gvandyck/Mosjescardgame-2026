import { registerCard } from "../../registry/card-registry.js";
import type { MosjeDefinition } from "../../schema/mosje-definition.js";
import type { CardId } from "../../../types/card-id.js";

export const JISCA_THE_MAESTRO: MosjeDefinition = {
  id: "jisca-the-maestro" as CardId,
  name: "Jisca The Maestro",
  category: "mosje",
  subcategory: "ARTISTIC",
  isBoosterOnly: false,
  cost: { type: "free" },
  requirements: [],
  target: "self_active_mosje",
  trigger: "passive",
  duration: "while_active",
  effects: [],
  mosjeType: "ARTISTIC",
  traits: { Physical: 0, Mental: 2, Social: 2, Creative: 3, Technical: 0, Resilient: 0 },
  startMP: 0,
  baseAbility: {
    trigger: "passive",
    usageLimit: "passive",
    description: "Perfect Combo: after any Piecie resolves, roll 1d6. 4-6=chain another Piecie from hand as Snelle and opponent loses 15 MP. 1-3=chain fails, this Mosje loses 10 MP (unless at 0).",
    effects: [
      {
        primitive: "rollBranch",
        params: {
          branches: [
            {
              range: [1, 3],
              effects: [
                {
                  primitive: "ifThenElse",
                  params: {
                    condition: {
                      primitive: "checkMP",
                      params: { target: "$self", operator: ">", value: 0 }
                    },
                    then: { primitive: "loseMP", params: { target: "$self", amount: 10 } },
                    else: { primitive: "gainMP", params: { target: "$self", amount: 0 } }
                  }
                }
              ]
            },
            {
              range: [4, 6],
              effects: [
                { primitive: "loseMP", params: { target: "$opponent", amount: 15 } }
              ]
            }
          ]
        }
      }
    ]
  }
};

registerCard(JISCA_THE_MAESTRO);
